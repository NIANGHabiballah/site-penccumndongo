<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'POST':
        $user = verifyToken();
        submitText($input, $user);
        break;
        
    case 'GET':
        $user = verifyToken();
        if ($user['role'] === 'participant') {
            getUserTexts($user['user_id']);
        } else {
            getAllTexts();
        }
        break;
        
    case 'PUT':
        $user = verifyToken();
        if ($user['role'] === 'correcteur') {
            updateTextStatus($input);
        } elseif ($user['role'] === 'admin') {
            updateAdminText($input, $user);
        } else {
            updateParticipantText($input, $user);
        }
        break;
        
    case 'DELETE':
        $user = verifyToken();
        if ($user['role'] === 'participant') {
            deleteParticipantText($user);
        }
        break;
}

function submitText($data, $user) {
    $db = getDB();
    
    $titre = $data['titre'] ?? '';
    $contenu = $data['contenu'] ?? '';
    $langue = $data['langue'] ?? 'francais';
    $theme = $data['theme'] ?? '';
    
    if (!$titre || !$contenu) {
        http_response_code(400);
        echo json_encode(['error' => 'Titre et contenu requis']);
        return;
    }
    
    // Vérifier si l'utilisateur a déjà soumis un texte
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM cp2i_textes WHERE user_id = ?");
    $stmt->execute([$user['user_id']]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result['count'] > 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Vous avez déjà soumis un texte pour cette édition. Un seul texte par participant est autorisé.']);
        return;
    }
    
    // Vérifier le nombre de vers (max 40)
    $verses = explode("\n", trim($contenu));
    $verseCount = count(array_filter($verses, 'trim'));
    
    if ($verseCount > 40) {
        http_response_code(400);
        echo json_encode(['error' => 'Maximum 40 vers autorisés']);
        return;
    }
    
    // Debug: afficher les données reçues
    error_log("Theme reçu: " . $theme);
    
    $stmt = $db->prepare("INSERT INTO cp2i_textes (user_id, titre, contenu, langue, theme, nb_vers, statut, created_at) VALUES (?, ?, ?, ?, ?, ?, 'en_attente', NOW())");
    
    // Debug: vérifier les valeurs avant insertion
    error_log("Valeurs: user_id={$user['user_id']}, titre=$titre, langue=$langue, theme=$theme, nb_vers=$verseCount");
    
    if ($stmt->execute([$user['user_id'], $titre, $contenu, $langue, $theme, $verseCount])) {
        // Enregistrer la soumission dans l'historique
        logAction($user['user_id'], 'text_submission', "Soumission du texte: $titre");
        
        echo json_encode([
            'success' => true,
            'message' => 'Texte soumis avec succès',
            'id' => $db->lastInsertId()
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de la soumission']);
    }
}

function getUserTexts($userId) {
    $db = getDB();
    
    $stmt = $db->prepare("
        SELECT 
            t.id, t.titre, t.contenu, t.langue, t.theme, t.nb_vers, t.statut, t.note, t.commentaire, t.created_at,
            CASE 
                WHEN EXISTS(SELECT 1 FROM cp2i_affectations a WHERE a.texte_id = t.id) THEN 0
                ELSE 1
            END as peut_modifier
        FROM cp2i_textes t 
        WHERE t.user_id = ? 
        ORDER BY t.created_at DESC
    ");
    $stmt->execute([$userId]);
    $textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['textes' => $textes]);
}

function getAllTexts() {
    $db = getDB();
    
    $stmt = $db->prepare("
        SELECT t.id, t.titre, t.contenu, t.langue, t.theme, t.nb_vers, t.statut, t.note, t.commentaire, t.created_at,
               u.nom, u.prenom, u.email
        FROM cp2i_textes t 
        JOIN cp2i_users u ON t.user_id = u.id 
        ORDER BY t.created_at DESC
    ");
    $stmt->execute();
    $textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['textes' => $textes]);
}

function updateTextStatus($data) {
    $db = getDB();
    
    $id = $data['id'] ?? 0;
    $statut = $data['statut'] ?? '';
    $note = $data['note'] ?? null;
    $commentaire = $data['commentaire'] ?? '';
    
    if (!$id || !$statut) {
        http_response_code(400);
        echo json_encode(['error' => 'ID et statut requis']);
        return;
    }
    
    $stmt = $db->prepare("UPDATE cp2i_textes SET statut = ?, note = ?, commentaire = ?, updated_at = NOW() WHERE id = ?");
    
    if ($stmt->execute([$statut, $note, $commentaire, $id])) {
        echo json_encode(['success' => true, 'message' => 'Statut mis à jour']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de la mise à jour']);
    }
}

function updateParticipantText($data, $user) {
    $db = getDB();
    
    $id = $data['id'] ?? 0;
    $titre = $data['titre'] ?? '';
    $contenu = $data['contenu'] ?? '';
    $langue = $data['langue'] ?? 'francais';
    $theme = $data['theme'] ?? '';
    
    if (!$id || !$titre || !$contenu) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Données incomplètes']);
        return;
    }
    
    // Vérifier que le texte appartient au participant
    $stmt = $db->prepare("SELECT id FROM cp2i_textes WHERE id = ? AND user_id = ?");
    $stmt->execute([$id, $user['user_id']]);
    
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Accès refusé']);
        return;
    }
    
    // Vérifier le nombre de vers
    $verses = explode("\n", trim($contenu));
    $verseCount = count(array_filter($verses, 'trim'));
    
    if ($verseCount > 40) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Maximum 40 vers autorisés']);
        return;
    }
    
    $stmt = $db->prepare("UPDATE cp2i_textes SET titre = ?, contenu = ?, langue = ?, theme = ?, nb_vers = ? WHERE id = ? AND user_id = ?");
    
    if ($stmt->execute([$titre, $contenu, $langue, $theme, $verseCount, $id, $user['user_id']])) {
        echo json_encode(['success' => true, 'message' => 'Texte modifié avec succès']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erreur lors de la modification']);
    }
}

function updateAdminText($data, $user) {
    $db = getDB();
    
    $id = $data['id'] ?? 0;
    $titre = $data['titre'] ?? '';
    $contenu = $data['contenu'] ?? '';
    $langue = $data['langue'] ?? 'francais';
    $theme = $data['theme'] ?? '';
    
    if (!$id || !$titre || !$contenu) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Données incomplètes']);
        return;
    }
    
    // Vérifier que le texte existe
    $stmt = $db->prepare("SELECT id FROM cp2i_textes WHERE id = ?");
    $stmt->execute([$id]);
    
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Texte non trouvé']);
        return;
    }
    
    // Vérifier le nombre de vers
    $verses = explode("\n", trim($contenu));
    $verseCount = count(array_filter($verses, 'trim'));
    
    if ($verseCount > 40) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Maximum 40 vers autorisés']);
        return;
    }
    
    $stmt = $db->prepare("UPDATE cp2i_textes SET titre = ?, contenu = ?, langue = ?, theme = ?, nb_vers = ? WHERE id = ?");
    
    if ($stmt->execute([$titre, $contenu, $langue, $theme, $verseCount, $id])) {
        // Enregistrer la modification dans l'historique
        logAction($user['user_id'], 'admin_text_edit', "Modification admin du texte ID: $id - $titre");
        
        echo json_encode(['success' => true, 'message' => 'Texte modifié avec succès']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erreur lors de la modification']);
    }
}

function deleteParticipantText($user) {
    $db = getDB();
    
    $texteId = $_GET['id'] ?? 0;
    
    if (!$texteId) {
        http_response_code(400);
        echo json_encode(['error' => 'ID du texte requis']);
        return;
    }
    
    // Vérifier que le texte appartient au participant et peut être supprimé
    $stmt = $db->prepare("SELECT id, statut FROM cp2i_textes WHERE id = ? AND user_id = ?");
    $stmt->execute([$texteId, $user['user_id']]);
    $texte = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$texte) {
        http_response_code(403);
        echo json_encode(['error' => 'Texte non trouvé ou accès refusé']);
        return;
    }
    
    // Vérifier si le texte peut être supprimé (pas encore évalué)
    if ($texte['statut'] === 'accepte' || $texte['statut'] === 'refuse') {
        http_response_code(400);
        echo json_encode(['error' => 'Ce texte a déjà été évalué et ne peut plus être supprimé']);
        return;
    }
    
    // Supprimer le texte
    $stmt = $db->prepare("DELETE FROM cp2i_textes WHERE id = ? AND user_id = ?");
    
    if ($stmt->execute([$texteId, $user['user_id']])) {
        // Enregistrer la suppression dans l'historique
        logAction($user['user_id'], 'text_deletion', "Suppression du texte ID: $texteId");
        
        echo json_encode(['success' => true, 'message' => 'Texte supprimé avec succès']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de la suppression']);
    }
}
?>