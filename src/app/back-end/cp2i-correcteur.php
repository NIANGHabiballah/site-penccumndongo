<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET') {
    $user = verifyToken();
    
    if ($user['role'] !== 'correcteur') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }
    
    switch ($action) {
        case 'textes':
            getCorrecteurTexts($user['id']);
            break;
        case 'messages':
            getCorrecteurMessages($user['id']);
            break;
        case 'history':
            getCorrecteurHistory($user['id']);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Action non spécifiée']);
    }
}

function getCorrecteurTexts($correcteurId) {
    try {
        $db = getDB();
        
        // Récupérer les textes assignés au correcteur
        $stmt = $db->prepare("
            SELECT t.*, u.prenom, u.nom, a.created_at as assigned_at
            FROM cp2i_textes t
            JOIN cp2i_users u ON t.user_id = u.id
            JOIN cp2i_affectations a ON t.id = a.texte_id
            WHERE a.corrector_id = ?
            ORDER BY t.created_at DESC
        ");
        $stmt->execute([$correcteurId]);
        $textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'textes' => $textes
        ]);
    } catch (Exception $e) {
        error_log('Error in getCorrecteurTexts: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur']);
    }
}

function getCorrecteurMessages($correcteurId) {
    try {
        $db = getDB();
        
        // Messages pour le correcteur
        $stmt = $db->prepare("
            SELECT m.*, u.prenom as sender_prenom, u.nom as sender_nom
            FROM cp2i_messages m
            JOIN cp2i_users u ON m.sender_id = u.id
            WHERE m.recipient_id = ? OR m.send_to_all = 1
            ORDER BY m.created_at DESC
            LIMIT 20
        ");
        $stmt->execute([$correcteurId]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'messages' => $messages
        ]);
    } catch (Exception $e) {
        error_log('Error in getCorrecteurMessages: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur']);
    }
}

function getCorrecteurHistory($correcteurId) {
    try {
        $db = getDB();
        
        // Historique des évaluations du correcteur
        $stmt = $db->prepare("
            SELECT t.titre, t.note, t.commentaire, t.statut, t.updated_at, u.prenom, u.nom
            FROM cp2i_textes t
            JOIN cp2i_users u ON t.user_id = u.id
            JOIN cp2i_affectations a ON t.id = a.texte_id
            WHERE a.corrector_id = ? AND t.note IS NOT NULL
            ORDER BY t.updated_at DESC
            LIMIT 50
        ");
        $stmt->execute([$correcteurId]);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'history' => $history
        ]);
    } catch (Exception $e) {
        error_log('Error in getCorrecteurHistory: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur']);
    }
}
?>