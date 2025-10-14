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
        }
        break;
}

function submitText($data, $user) {
    $db = getDB();
    
    $titre = $data['titre'] ?? '';
    $contenu = $data['contenu'] ?? '';
    $langue = $data['langue'] ?? 'francais';
    
    if (!$titre || !$contenu) {
        http_response_code(400);
        echo json_encode(['error' => 'Titre et contenu requis']);
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
    
    $stmt = $db->prepare("INSERT INTO cp2i_textes (user_id, titre, contenu, langue, nb_vers, statut, created_at) VALUES (?, ?, ?, ?, ?, 'en_attente', NOW())");
    
    if ($stmt->execute([$user['user_id'], $titre, $contenu, $langue, $verseCount])) {
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
    
    $stmt = $db->prepare("SELECT id, titre, langue, nb_vers, statut, note, commentaire, created_at FROM cp2i_textes WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->execute([$userId]);
    $textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['textes' => $textes]);
}

function getAllTexts() {
    $db = getDB();
    
    $stmt = $db->prepare("
        SELECT t.id, t.titre, t.contenu, t.langue, t.nb_vers, t.statut, t.note, t.commentaire, t.created_at,
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
?>