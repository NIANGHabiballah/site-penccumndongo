<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user = verifyToken();
    $action = $_GET['action'] ?? 'messages';
    
    if ($user['role'] !== 'participant') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }
    
    switch ($action) {
        case 'messages':
            getParticipantMessages($user);
            break;
        case 'history':
            getParticipantHistory($user);
            break;
        case 'evaluations':
            getDetailedEvaluations($user);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Action non reconnue']);
    }
}

function getParticipantMessages($user) {
    $db = getDB();
    
    $stmt = $db->prepare("
        SELECT m.*, mr.read_at,
               u.prenom as sender_prenom, u.nom as sender_nom
        FROM cp2i_messages m
        JOIN cp2i_message_recipients mr ON m.id = mr.message_id
        LEFT JOIN cp2i_users u ON m.sender_id = u.id
        WHERE mr.recipient_id = ?
        ORDER BY m.created_at DESC
    ");
    $stmt->execute([$user['user_id']]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['messages' => $messages]);
}

function getParticipantHistory($user) {
    $db = getDB();
    
    // Historique des actions du participant
    $history = [];
    
    // Inscription
    $stmt = $db->prepare("SELECT created_at FROM cp2i_users WHERE id = ?");
    $stmt->execute([$user['user_id']]);
    $inscription = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($inscription) {
        $history[] = [
            'action' => 'Inscription',
            'description' => 'Inscription au concours CP2i 2025',
            'created_at' => $inscription['created_at']
        ];
    }
    
    // Soumissions de textes
    $stmt = $db->prepare("SELECT titre, created_at FROM cp2i_textes WHERE user_id = ? ORDER BY created_at");
    $stmt->execute([$user['user_id']]);
    $textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($textes as $texte) {
        $history[] = [
            'action' => 'Soumission de texte',
            'description' => "Soumission du poème '{$texte['titre']}'",
            'created_at' => $texte['created_at']
        ];
    }
    
    // Évaluations reçues
    $stmt = $db->prepare("
        SELECT t.titre, t.note, t.updated_at 
        FROM cp2i_textes t 
        WHERE t.user_id = ? AND t.note IS NOT NULL 
        ORDER BY t.updated_at
    ");
    $stmt->execute([$user['user_id']]);
    $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($evaluations as $eval) {
        $history[] = [
            'action' => 'Évaluation reçue',
            'description' => "Évaluation du poème '{$eval['titre']}' - Note: {$eval['note']}/20",
            'created_at' => $eval['updated_at']
        ];
    }
    
    // Trier par date
    usort($history, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    
    echo json_encode(['history' => $history]);
}

function getDetailedEvaluations($user) {
    $db = getDB();
    
    // Récupérer les textes du participant avec leurs évaluations
    $stmt = $db->prepare("
        SELECT t.id, t.titre, t.statut, t.note as note_moyenne
        FROM cp2i_textes t
        WHERE t.user_id = ?
        ORDER BY t.created_at DESC
    ");
    $stmt->execute([$user['user_id']]);
    $textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $evaluations = [];
    
    foreach ($textes as $texte) {
        // Récupérer les évaluations de chaque correcteur pour ce texte
        $stmt = $db->prepare("
            SELECT 
                e.pertinence, e.coherence, e.correction, e.presentation,
                e.note_totale, e.remarques, e.created_at,
                u.id as correcteur_id,
                ROW_NUMBER() OVER (ORDER BY e.created_at) as correcteur_numero
            FROM cp2i_evaluations e
            JOIN cp2i_affectations a ON e.texte_id = a.texte_id AND e.correcteur_id = a.correcteur_id
            JOIN cp2i_users u ON e.correcteur_id = u.id
            WHERE e.texte_id = ?
            ORDER BY e.created_at
        ");
        $stmt->execute([$texte['id']]);
        $correcteurs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $evaluations[] = [
            'id' => $texte['id'],
            'titre' => $texte['titre'],
            'statut' => $texte['statut'],
            'note_moyenne' => $texte['note_moyenne'],
            'correcteurs' => $correcteurs
        ];
    }
    
    echo json_encode(['evaluations' => $evaluations]);
}
?>