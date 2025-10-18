<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $user = verifyToken();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    sendMessage($user, $input);
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