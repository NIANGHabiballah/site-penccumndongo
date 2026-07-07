<?php
require_once 'config.php';
header('Content-Type: application/json');
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$user = verifyToken();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Non autorisé']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'messages') {
            getParticipantMessages($user);
        } elseif ($action === 'unread_count') {
            getUnreadCount($user);
        } elseif ($action === 'message') {
            getMessageById($user, $_GET['id'] ?? 0);
        }
        break;
    case 'POST':
        if ($action === 'mark_read') {
            markMessageAsRead($user, json_decode(file_get_contents("php://input"), true));
        } elseif ($action === 'mark_all_read') {
            markAllMessagesAsRead($user);
        }
        break;
}

function getParticipantMessages($user) {
    $pdo = getDB();
    
    try {
        // Messages destinés à cet utilisateur spécifiquement ou à tous
        $stmt = $pdo->prepare("
            SELECT DISTINCT
                m.id,
                m.subject,
                m.content,
                m.created_at,
                m.send_to_all,
                mr.read_at,
                u.nom as sender_nom,
                u.prenom as sender_prenom,
                CASE 
                    WHEN mr.read_at IS NOT NULL THEN 1 
                    ELSE 0 
                END as is_read
            FROM cp2i_messages m
            LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id AND mr.recipient_id = ?
            LEFT JOIN cp2i_users u ON m.sender_id = u.id
            WHERE m.sender_id != ?
              AND (m.send_to_all = 1 OR mr.recipient_id = ?)
            ORDER BY m.created_at DESC
        ");
        $stmt->execute([$user['user_id'], $user['user_id'], $user['user_id']]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Pour les messages collectifs sans entrée dans message_recipients, créer l'entrée
        foreach ($messages as &$message) {
            if ($message['send_to_all'] == 1 && !$message['read_at']) {
                $checkStmt = $pdo->prepare("SELECT id FROM cp2i_message_recipients WHERE message_id = ? AND recipient_id = ?");
                $checkStmt->execute([$message['id'], $user['user_id']]);
                
                if (!$checkStmt->fetch()) {
                    $insertStmt = $pdo->prepare("INSERT IGNORE INTO cp2i_message_recipients (message_id, recipient_id) VALUES (?, ?)");
                    $insertStmt->execute([$message['id'], $user['user_id']]);
                }
            }
        }
        
        error_log("Messages récupérés pour utilisateur {$user['user_id']}: " . count($messages));
        
        echo json_encode([
            'success' => true,
            'messages' => $messages
        ]);
        
    } catch (Exception $e) {
        error_log('Erreur getParticipantMessages: ' . $e->getMessage());
        echo json_encode(['success' => false, 'error' => 'Erreur récupération messages']);
    }
}

function getUnreadCount($user) {
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count
            FROM cp2i_message_recipients mr
            WHERE mr.recipient_id = ? AND mr.read_at IS NULL
        ");
        $stmt->execute([$user['user_id']]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'count' => (int)$result['count']
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Erreur comptage messages']);
    }
}

function getMessageById($user, $messageId) {
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("
            SELECT 
                m.id,
                m.subject,
                m.content,
                m.created_at,
                m.send_to_all,
                mr.read_at,
                u.nom as sender_nom,
                u.prenom as sender_prenom
            FROM cp2i_messages m
            LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id AND mr.recipient_id = ?
            LEFT JOIN cp2i_users u ON m.sender_id = u.id
            WHERE m.id = ? AND (mr.recipient_id = ? OR m.send_to_all = 1)
        ");
        $stmt->execute([$user['user_id'], $messageId, $user['user_id']]);
        $message = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($message) {
            echo json_encode([
                'success' => true,
                'message' => $message
            ]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Message non trouvé']);
        }
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Erreur récupération message']);
    }
}

function markMessageAsRead($user, $data) {
    $pdo = getDB();
    $messageId = $data['message_id'] ?? 0;
    
    try {
        // Vérifier si l'enregistrement existe déjà
        $stmt = $pdo->prepare("
            SELECT id FROM cp2i_message_recipients 
            WHERE message_id = ? AND recipient_id = ?
        ");
        $stmt->execute([$messageId, $user['user_id']]);
        
        if ($stmt->fetch()) {
            // Mettre à jour
            $stmt = $pdo->prepare("
                UPDATE cp2i_message_recipients 
                SET read_at = NOW() 
                WHERE message_id = ? AND recipient_id = ? AND read_at IS NULL
            ");
            $stmt->execute([$messageId, $user['user_id']]);
        } else {
            // Créer l'enregistrement avec read_at
            $stmt = $pdo->prepare("
                INSERT INTO cp2i_message_recipients (message_id, recipient_id, read_at) 
                VALUES (?, ?, NOW())
            ");
            $stmt->execute([$messageId, $user['user_id']]);
        }
        
        echo json_encode(['success' => true]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Erreur marquage lu']);
    }
}

function markAllMessagesAsRead($user) {
    $pdo = getDB();
    
    try {
        // Marquer tous les messages non lus comme lus
        $stmt = $pdo->prepare("
            INSERT INTO cp2i_message_recipients (message_id, recipient_id, read_at)
            SELECT m.id, ?, NOW()
            FROM cp2i_messages m
            LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id AND mr.recipient_id = ?
            WHERE (m.send_to_all = 1 OR mr.recipient_id = ?) AND mr.read_at IS NULL
            ON DUPLICATE KEY UPDATE read_at = NOW()
        ");
        $stmt->execute([$user['user_id'], $user['user_id'], $user['user_id']]);
        
        echo json_encode(['success' => true]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Erreur marquage tous lus']);
    }
}
?>