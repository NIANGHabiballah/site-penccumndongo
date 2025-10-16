<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user = verifyToken();
    $action = $_GET['action'] ?? 'list';
    
    switch ($action) {
        case 'list':
            getMessages($user);
            break;
        case 'recipients':
            getRecipients($user);
            break;
    }
}

if ($method === 'POST') {
    $user = verifyToken();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }
    
    $action = $_GET['action'] ?? 'send';
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'send':
            sendMessage($user, $input);
            break;
        case 'delete':
            deleteMessage($user, $input);
            break;
    }
}

function getMessages($user) {
    $db = getDB();
    
    // Récupérer tous les messages envoyés par l'admin
    $stmt = $db->prepare("
        SELECT m.*, 
               COUNT(mr.id) as total_recipients,
               COUNT(CASE WHEN mr.read_at IS NOT NULL THEN 1 END) as read_count
        FROM cp2i_messages m
        LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id
        WHERE m.sender_id = ?
        GROUP BY m.id
        ORDER BY m.created_at DESC
    ");
    $stmt->execute([$user['user_id']]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['messages' => $messages]);
}

function getRecipients($user) {
    $db = getDB();
    
    // Récupérer tous les utilisateurs pour la sélection des destinataires
    $stmt = $db->prepare("
        SELECT id, email, prenom, nom, role 
        FROM cp2i_users 
        WHERE id != ?
        ORDER BY role, prenom, nom
    ");
    $stmt->execute([$user['user_id']]);
    $recipients = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['recipients' => $recipients]);
}

function sendMessage($user, $data) {
    $db = getDB();
    
    $subject = $data['subject'] ?? '';
    $content = $data['content'] ?? '';
    $recipients = $data['recipients'] ?? [];
    $send_to_all = $data['send_to_all'] ?? false;
    
    if (!$subject || !$content) {
        http_response_code(400);
        echo json_encode(['error' => 'Sujet et contenu requis']);
        return;
    }
    
    try {
        $db->beginTransaction();
        
        // Créer le message
        $stmt = $db->prepare("
            INSERT INTO cp2i_messages (sender_id, subject, content, send_to_all) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$user['user_id'], $subject, $content, $send_to_all ? 1 : 0]);
        $message_id = $db->lastInsertId();
        
        // Déterminer les destinataires
        if ($send_to_all) {
            // Envoyer à tous les utilisateurs sauf l'expéditeur
            $stmt = $db->prepare("SELECT id FROM cp2i_users WHERE id != ?");
            $stmt->execute([$user['user_id']]);
            $all_users = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $recipients = $all_users;
        }
        
        // Ajouter les destinataires
        foreach ($recipients as $recipient_id) {
            $stmt = $db->prepare("
                INSERT INTO cp2i_message_recipients (message_id, recipient_id) 
                VALUES (?, ?)
            ");
            $stmt->execute([$message_id, $recipient_id]);
        }
        
        // Historique
        $recipient_count = count($recipients);
        $description = "Message envoyé: '$subject' à $recipient_count destinataire(s)";
        $stmt = $db->prepare("
            INSERT INTO cp2i_history (user_id, action, description) 
            VALUES (?, 'message', ?)
        ");
        $stmt->execute([$user['user_id'], $description]);
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => "Message envoyé à $recipient_count destinataire(s)"
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de l\'envoi du message']);
    }
}

function deleteMessage($user, $data) {
    $db = getDB();
    
    $message_id = $data['message_id'] ?? 0;
    
    if (!$message_id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID du message requis']);
        return;
    }
    
    try {
        $db->beginTransaction();
        
        // Supprimer les destinataires
        $stmt = $db->prepare("DELETE FROM cp2i_message_recipients WHERE message_id = ?");
        $stmt->execute([$message_id]);
        
        // Supprimer le message
        $stmt = $db->prepare("DELETE FROM cp2i_messages WHERE id = ? AND sender_id = ?");
        $stmt->execute([$message_id, $user['user_id']]);
        
        $db->commit();
        
        echo json_encode(['success' => true, 'message' => 'Message supprimé']);
        
    } catch (Exception $e) {
        $db->rollback();
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de la suppression']);
    }
}

// Créer les tables si elles n'existent pas
function createMessageTables() {
    $db = getDB();
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS cp2i_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sender_id INT NOT NULL,
            subject VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            send_to_all BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES cp2i_users(id) ON DELETE CASCADE
        )
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS cp2i_message_recipients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message_id INT NOT NULL,
            recipient_id INT NOT NULL,
            read_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (message_id) REFERENCES cp2i_messages(id) ON DELETE CASCADE,
            FOREIGN KEY (recipient_id) REFERENCES cp2i_users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_recipient (message_id, recipient_id)
        )
    ");
}

// Initialiser les tables au premier appel
createMessageTables();
?>