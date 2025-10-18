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
            getCorrecteurTexts($user['user_id']);
            break;
        case 'messages':
            getCorrecteurMessages($user['user_id']);
            break;
        case 'history':
            getCorrecteurHistory($user['user_id']);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Action non spécifiée']);
    }
}

if ($method === 'POST') {
    $user = verifyToken();
    
    if ($user['role'] !== 'correcteur') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }
    
    switch ($action) {
        case 'mark_read':
            markMessageAsRead($user['user_id']);
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
        
        $stmt = $db->prepare("
            SELECT m.*, u.prenom as sender_prenom, u.nom as sender_nom, mr.read_at
            FROM cp2i_messages m
            LEFT JOIN cp2i_users u ON m.sender_id = u.id
            LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id AND mr.recipient_id = ?
            WHERE m.send_to_all = 1 OR mr.recipient_id = ?
            ORDER BY m.created_at DESC
        ");
        $stmt->execute([$correcteurId, $correcteurId]);
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

function markMessageAsRead($correcteurId) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $messageId = $input['message_id'] ?? 0;
        
        if (!$messageId) {
            http_response_code(400);
            echo json_encode(['error' => 'ID du message requis']);
            return;
        }
        
        $db = getDB();
        
        // Créer l'entrée si c'est un message send_to_all
        $stmt = $db->prepare("SELECT send_to_all FROM cp2i_messages WHERE id = ?");
        $stmt->execute([$messageId]);
        $message = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($message && $message['send_to_all']) {
            $stmt = $db->prepare("INSERT IGNORE INTO cp2i_message_recipients (message_id, recipient_id, read_at) VALUES (?, ?, NOW())");
            $stmt->execute([$messageId, $correcteurId]);
        } else {
            $stmt = $db->prepare("UPDATE cp2i_message_recipients SET read_at = NOW() WHERE message_id = ? AND recipient_id = ? AND read_at IS NULL");
            $stmt->execute([$messageId, $correcteurId]);
        }
        
        echo json_encode(['success' => true]);
        
    } catch (Exception $e) {
        error_log('Error in markMessageAsRead: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur']);
    }
}
?>