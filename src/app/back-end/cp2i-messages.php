<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST') {
    $user = verifyToken();
    
    if ($action === 'mark_read') {
        // Permettre aux correcteurs de marquer les messages comme lus
        if ($user['role'] !== 'correcteur' && $user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Accès refusé']);
            exit;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        markMessageAsRead($user, $input);
    } else {
        // Seuls les admins peuvent envoyer des messages
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Accès refusé']);
            exit;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        sendMessage($user, $input);
    }
} elseif ($method === 'GET') {
    $user = verifyToken();
    getMessages($user);
}

function getMessages($user) {
    try {
        $pdo = getDB();
        
        if ($user['role'] === 'admin') {
            // Pour les admins, retourner leurs messages envoyés avec statistiques
            $stmt = $pdo->prepare("
                SELECT m.id, m.subject, m.content, m.created_at, m.send_to_all,
                       COUNT(mr.id) as total_recipients,
                       COUNT(mr.read_at) as read_count,
                       CASE 
                           WHEN m.send_to_all = 1 THEN 'Tous les utilisateurs'
                           ELSE GROUP_CONCAT(CONCAT(u.prenom, ' ', u.nom) SEPARATOR ', ')
                       END as recipients_names
                FROM cp2i_messages m
                LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id
                LEFT JOIN cp2i_users u ON mr.recipient_id = u.id
                WHERE m.sender_id = ?
                GROUP BY m.id
                ORDER BY m.created_at DESC
            ");
            $stmt->execute([$user['user_id']]);
            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'messages' => $messages]);
        } else {
            // Pour les autres utilisateurs, retourner les messages reçus
            $stmt = $pdo->prepare("
                SELECT m.*, u.prenom as sender_prenom, u.nom as sender_nom, mr.read_at
                FROM cp2i_messages m
                LEFT JOIN cp2i_users u ON m.sender_id = u.id
                LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id AND mr.recipient_id = ?
                WHERE m.send_to_all = 1 OR mr.recipient_id = ?
                ORDER BY m.created_at DESC
            ");
            $stmt->execute([$user['user_id'], $user['user_id']]);
            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'messages' => $messages]);
        }
        
    } catch (Exception $e) {
        error_log('Error in getMessages: ' . $e->getMessage());
        echo json_encode(['success' => true, 'messages' => []]);
    }
}

function markMessageAsRead($user, $data) {
    try {
        $message_id = $data['message_id'] ?? 0;
        
        if (!$message_id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID du message requis']);
            return;
        }
        
        $db = getDB();
        
        // Vérifier si c'est un message send_to_all
        $stmt = $db->prepare("SELECT send_to_all FROM cp2i_messages WHERE id = ?");
        $stmt->execute([$message_id]);
        $message = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($message && $message['send_to_all']) {
            $stmt = $db->prepare("INSERT IGNORE INTO cp2i_message_recipients (message_id, recipient_id, read_at) VALUES (?, ?, NOW())");
            $stmt->execute([$message_id, $user['user_id']]);
        } else {
            $stmt = $db->prepare("UPDATE cp2i_message_recipients SET read_at = NOW() WHERE message_id = ? AND recipient_id = ? AND read_at IS NULL");
            $stmt->execute([$message_id, $user['user_id']]);
        }
        
        echo json_encode(['success' => true]);
        
    } catch (Exception $e) {
        error_log('Error in markMessageAsRead: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur']);
    }
}

function sendMessage($user, $data) {
    $db = getDB();
    
    $subject = $data['subject'] ?? '';
    $content = $data['content'] ?? '';
    $send_to_all = $data['send_to_all'] ?? false;
    
    if (!$subject || !$content) {
        http_response_code(400);
        echo json_encode(['error' => 'Sujet et contenu requis']);
        return;
    }
    
    try {
        // Insérer le message
        $stmt = $db->prepare("INSERT INTO cp2i_messages (sender_id, subject, content, send_to_all) VALUES (?, ?, ?, ?)");
        $stmt->execute([$user['user_id'], $subject, $content, $send_to_all ? 1 : 0]);
        $message_id = $db->lastInsertId();
        
        $recipient_count = 0;
        
        if ($send_to_all) {
            // Envoyer à tous les utilisateurs sauf l'expéditeur
            $stmt = $db->prepare("SELECT id FROM cp2i_users WHERE id != ?");
            $stmt->execute([$user['user_id']]);
            $all_recipients = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Insérer chaque destinataire une seule fois
            foreach ($all_recipients as $recipient_id) {
                $stmt = $db->prepare("INSERT INTO cp2i_message_recipients (message_id, recipient_id) VALUES (?, ?)");
                $stmt->execute([$message_id, $recipient_id]);
            }
            $recipient_count = count($all_recipients);
        } else {
            $recipients = $data['recipients'] ?? [];
            // Insérer les destinataires sélectionnés
            foreach ($recipients as $recipient_id) {
                $stmt = $db->prepare("INSERT INTO cp2i_message_recipients (message_id, recipient_id) VALUES (?, ?)");
                $stmt->execute([$message_id, $recipient_id]);
            }
            $recipient_count = count($recipients);
        }
        
        echo json_encode([
            'success' => true,
            'message' => "Message envoyé à $recipient_count destinataire(s)"
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de l\'envoi du message']);
    }
}
?>