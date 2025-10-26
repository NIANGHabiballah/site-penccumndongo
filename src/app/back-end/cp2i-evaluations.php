<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user = verifyToken();
    $action = $_GET['action'] ?? 'list';
    
    switch ($action) {
        case 'list':
            getEvaluations($user);
            break;
        case 'history':
            getEvaluationHistory($_GET['texte_id'] ?? 0);
            break;
    }
}

if ($method === 'POST') {
    $user = verifyToken();
    if ($user['role'] !== 'admin' && $user['role'] !== 'correcteur') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }
    
    $action = $_GET['action'] ?? 'evaluate';
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'evaluate':
            saveEvaluation($user, $input);
            break;
        case 'reassign':
            reassignTexte($user, $input);
            break;
        case 'send_reminders':
            sendReminders($user);
            break;
    }
}

function getEvaluations($user) {
    $db = getDB();
    
    // Récupérer tous les textes avec informations d'évaluation
    $stmt = $db->prepare("
        SELECT t.*, u.prenom, u.nom, u.email,
               c.prenom as correcteur_prenom, c.nom as correcteur_nom,
               a.corrector_id
        FROM cp2i_textes t
        JOIN cp2i_users u ON t.user_id = u.id
        LEFT JOIN cp2i_affectations a ON u.id = a.participant_id
        LEFT JOIN cp2i_users c ON a.corrector_id = c.id
        ORDER BY 
            CASE t.statut 
                WHEN 'en_attente' THEN 1 
                WHEN 'accepte' THEN 2 
                WHEN 'refuse' THEN 3 
            END,
            t.created_at DESC
    ");
    $stmt->execute();
    $textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Statistiques d'évaluation
    $stmt = $db->prepare("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
            SUM(CASE WHEN statut = 'accepte' THEN 1 ELSE 0 END) as acceptes,
            SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END) as refuses,
            AVG(CASE WHEN note IS NOT NULL THEN note ELSE NULL END) as note_moyenne
        FROM cp2i_textes
    ");
    $stmt->execute();
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'textes' => $textes,
        'stats' => $stats
    ]);
}

function saveEvaluation($user, $data) {
    $db = getDB();
    
    $texte_id = $data['texte_id'] ?? 0;
    $pertinence = $data['pertinence'] ?? 0;
    $coherence = $data['coherence'] ?? 0;
    $correction = $data['correction'] ?? 0;
    $presentation = $data['presentation'] ?? 0;
    $note = $data['note'] ?? ($pertinence + $coherence + $correction + $presentation);
    $commentaire = $data['commentaire'] ?? '';
    $statut = $data['statut'] ?? 'en_attente';
    
    if (!$texte_id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID du texte requis']);
        return;
    }
    
    try {
        $db->beginTransaction();
        
        // 1. Mettre à jour cp2i_textes (comme avant)
        $stmt = $db->prepare("
            UPDATE cp2i_textes 
            SET note = ?, commentaire = ?, statut = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$note, $commentaire, $statut, $texte_id]);
        
        // 2. NOUVEAU: Sauvegarder dans cp2i_evaluations avec les notes par critère
        $stmt = $db->prepare("
            INSERT INTO cp2i_evaluations 
            (texte_id, correcteur_id, pertinence, coherence, correction, presentation, note_totale, remarques, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
            pertinence = VALUES(pertinence),
            coherence = VALUES(coherence),
            correction = VALUES(correction),
            presentation = VALUES(presentation),
            note_totale = VALUES(note_totale),
            remarques = VALUES(remarques),
            updated_at = NOW()
        ");
        $stmt->execute([$texte_id, $user['user_id'], $pertinence, $coherence, $correction, $presentation, $note, $commentaire]);
        
        // 3. Historique
        $stmt = $db->prepare("
            INSERT INTO cp2i_history (user_id, action, description) 
            VALUES (?, 'evaluation', ?)
        ");
        $description = "Évaluation détaillée - Texte ID $texte_id - P:$pertinence C:$coherence Cor:$correction Pr:$presentation - Total: $note/20";
        $stmt->execute([$user['user_id'], $description]);
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Évaluation sauvegardée avec notes par critère'
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        http_response_code(500);
        echo json_encode(['error' => 'Erreur: ' . $e->getMessage()]);
    }
}

function getEvaluationHistory($texte_id) {
    $db = getDB();
    
    if (!$texte_id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID du texte requis']);
        return;
    }
    
    // Historique des modifications du texte
    $stmt = $db->prepare("
        SELECT h.*, u.prenom, u.nom
        FROM cp2i_history h
        JOIN cp2i_users u ON h.user_id = u.id
        WHERE h.description LIKE ?
        ORDER BY h.created_at DESC
    ");
    $stmt->execute(["%texte ID $texte_id%"]);
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['history' => $history]);
}

function reassignTexte($user, $data) {
    $db = getDB();
    
    $participant_id = $data['participant_id'] ?? 0;
    $new_corrector_id = $data['corrector_id'] ?? 0;
    
    if (!$participant_id || !$new_corrector_id) {
        http_response_code(400);
        echo json_encode(['error' => 'IDs participant et correcteur requis']);
        return;
    }
    
    try {
        // Mettre à jour l'affectation
        $stmt = $db->prepare("
            UPDATE cp2i_affectations 
            SET corrector_id = ? 
            WHERE participant_id = ?
        ");
        $stmt->execute([$new_corrector_id, $participant_id]);
        
        // Historique
        $stmt = $db->prepare("
            INSERT INTO cp2i_history (user_id, action, description) 
            VALUES (?, 'reassignation', ?)
        ");
        $description = "Réassignation du participant ID $participant_id au correcteur ID $new_corrector_id";
        $stmt->execute([$user['user_id'], $description]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Réassignation effectuée avec succès'
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de la réassignation']);
    }
}

function sendReminders($user) {
    $db = getDB();
    
    // Compter les textes en attente
    $stmt = $db->prepare("
        SELECT COUNT(*) as count
        FROM cp2i_textes t
        JOIN cp2i_affectations a ON t.user_id = a.participant_id
        WHERE t.statut = 'en_attente'
    ");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $count = $result['count'];
    
    if ($count == 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Aucun texte en attente d\'évaluation'
        ]);
        return;
    }
    
    // Simuler l'envoi de rappels (ici on pourrait envoyer des emails)
    // Enregistrer l'action dans l'historique
    $stmt = $db->prepare("
        INSERT INTO cp2i_history (user_id, action, description) 
        VALUES (?, 'rappel', ?)
    ");
    $description = "Rappels envoyés pour $count textes en attente d'évaluation";
    $stmt->execute([$user['user_id'], $description]);
    
    echo json_encode([
        'success' => true,
        'message' => "Rappels envoyés pour $count textes en attente"
    ]);
}
?>