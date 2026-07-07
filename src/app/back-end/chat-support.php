<?php
require_once 'config.php';
header('Content-Type: application/json');
setCorsHeaders();

try {
    $user = verifyToken();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Token invalide']);
        exit;
    }
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['error' => 'Erreur authentification: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'conversations') {
            getConversations($user);
        } elseif ($action === 'messages') {
            getMessages($user, $_GET['conversation_id']);
        } elseif ($action === 'unread_count') {
            getUnreadCount($user);
        } elseif ($action === 'stats') {
            getSupportStats($user);
        } elseif ($action === 'admins') {
            getAvailableAdmins($user);
        }
        break;
    case 'POST':
        if ($action === 'create') {
            createConversation($user, $data);
        } elseif ($action === 'send') {
            sendMessage($user, $data);
        } elseif ($action === 'mark_read') {
            markAsRead($user, $data);
        } elseif ($action === 'assign') {
            assignConversation($user, $data);
        } elseif ($action === 'close') {
            closeConversation($user, $data);
        } elseif ($action === 'priority') {
            setPriority($user, $data);
        } elseif ($action === 'send_with_images') {
            sendMessageWithImages($user);
        } elseif ($action === 'create_with_images') {
            createConversationWithImages($user);
        } elseif ($action === 'delete') {
            deleteConversation($user, $data);
        }
        break;
    case 'DELETE':
        if ($action === 'delete') {
            $conversationId = $_GET['conversation_id'] ?? null;
            deleteConversation($user, ['conversation_id' => $conversationId]);
        }
        break;
}

function getConversations($user) {
    $pdo = getDB();
    
    if ($user['role'] === 'admin') {
        $stmt = $pdo->query("
            SELECT c.*, u.nom, u.prenom, u.email,
                   CONCAT(u.prenom, ' ', u.nom) as user_name,
                   u.email as user_email,
                   CONCAT(a.prenom, ' ', a.nom) as admin_name,
                   COUNT(CASE WHEN m.read_status = 0 AND m.sender_type = 'participant' THEN 1 END) as unread_count
            FROM chat_conversations c
            JOIN cp2i_users u ON c.participant_id = u.id
            LEFT JOIN cp2i_users a ON c.admin_id = a.id
            LEFT JOIN chat_messages m ON c.id = m.conversation_id
            GROUP BY c.id
            ORDER BY c.updated_at DESC
        ");
    } else {
        $stmt = $pdo->prepare("
            SELECT c.*,
                   COUNT(CASE WHEN m.read_status = 0 AND m.sender_type = 'admin' THEN 1 END) as unread_count
            FROM chat_conversations c
            LEFT JOIN chat_messages m ON c.id = m.conversation_id
            WHERE c.participant_id = ?
            GROUP BY c.id
            ORDER BY c.updated_at DESC
        ");
        $stmt->execute([$user['user_id']]);
    }
    
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

function getMessages($user, $conversationId) {
    $pdo = getDB();
    
    // Vérifier l'accès à la conversation
    $stmt = $pdo->prepare("
        SELECT * FROM chat_conversations 
        WHERE id = ? AND (participant_id = ? OR ? = 'admin')
    ");
    $stmt->execute([$conversationId, $user['user_id'], $user['role']]);
    
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        return;
    }
    
    $stmt = $pdo->prepare("
        SELECT m.*, u.nom, u.prenom, m.images
        FROM chat_messages m
        JOIN cp2i_users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.timestamp ASC
    ");
    $stmt->execute([$conversationId]);
    
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Debug: Log les messages pour voir le contenu
    error_log('Messages récupérés pour conversation ' . $conversationId . ': ' . json_encode($messages));
    
    echo json_encode($messages);
}

function createConversation($user, $data) {
    $pdo = getDB();
    
    $userId = $user['user_id'];
    
    try {
        $pdo->beginTransaction();
        
        // Créer la conversation
        $stmt = $pdo->prepare("
            INSERT INTO chat_conversations (participant_id, subject, status, priority, created_at, updated_at)
            VALUES (?, ?, 'open', 'medium', NOW(), NOW())
        ");
        $stmt->execute([$userId, $data['subject']]);
        $conversationId = $pdo->lastInsertId();
        
        // Ajouter le message initial
        $stmt = $pdo->prepare("
            INSERT INTO chat_messages (conversation_id, sender_id, sender_type, message, timestamp, read_status)
            VALUES (?, ?, 'participant', ?, NOW(), 0)
        ");
        $stmt->execute([$conversationId, $userId, $data['message']]);
        
        $pdo->commit();
        echo json_encode(['success' => true, 'conversation_id' => $conversationId]);
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['error' => 'Erreur création conversation: ' . $e->getMessage()]);
    }
}

function sendMessage($user, $data) {
    $pdo = getDB();
    
    try {
        // Vérifier l'accès à la conversation
        $stmt = $pdo->prepare("
            SELECT * FROM chat_conversations 
            WHERE id = ? AND (participant_id = ? OR ? = 'admin')
        ");
        $stmt->execute([$data['conversation_id'], $user['user_id'], $user['role']]);
        
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode(['error' => 'Accès refusé']);
            return;
        }
        
        $senderType = $user['role'] === 'admin' ? 'admin' : 'participant';
        
        $stmt = $pdo->prepare("
            INSERT INTO chat_messages (conversation_id, sender_id, sender_type, message, timestamp, read_status)
            VALUES (?, ?, ?, ?, NOW(), 0)
        ");
        $stmt->execute([$data['conversation_id'], $user['user_id'], $senderType, $data['message']]);
        
        // Mettre à jour la conversation
        $stmt = $pdo->prepare("UPDATE chat_conversations SET updated_at = NOW() WHERE id = ?");
        $stmt->execute([$data['conversation_id']]);
        
        echo json_encode(['success' => true]);
        
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Erreur envoi message']);
    }
}

function markAsRead($user, $data) {
    $pdo = getDB();
    
    try {
        $senderType = $user['role'] === 'admin' ? 'participant' : 'admin';
        
        $stmt = $pdo->prepare("
            UPDATE chat_messages 
            SET read_status = 1 
            WHERE conversation_id = ? AND sender_type = ?
        ");
        $stmt->execute([$data['conversation_id'], $senderType]);
        
        echo json_encode(['success' => true]);
        
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Erreur marquage lu']);
    }
}

function assignConversation($user, $data) {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        return;
    }
    
    $pdo = getDB();
    
    try {
        $adminId = $data['admin_id'] ?? $user['user_id'];
        $stmt = $pdo->prepare("
            UPDATE chat_conversations 
            SET admin_id = ?, status = 'assigned', updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$adminId, $data['conversation_id']]);
        
        echo json_encode(['success' => true]);
        
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Erreur assignation']);
    }
}

function closeConversation($user, $data) {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        return;
    }
    
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("
            UPDATE chat_conversations 
            SET status = 'closed', updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$data['conversation_id']]);
        
        echo json_encode(['success' => true]);
        
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Erreur fermeture']);
    }
}

function setPriority($user, $data) {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        return;
    }
    
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("
            UPDATE chat_conversations 
            SET priority = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$data['priority'], $data['conversation_id']]);
        
        echo json_encode(['success' => true]);
        
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Erreur priorité']);
    }
}

function getUnreadCount($user) {
    $pdo = getDB();
    
    if ($user['role'] === 'admin') {
        $stmt = $pdo->query("
            SELECT COUNT(*) as count 
            FROM chat_messages m
            JOIN chat_conversations c ON m.conversation_id = c.id
            WHERE m.read_status = 0 AND m.sender_type = 'participant'
        ");
    } else {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM chat_messages m
            JOIN chat_conversations c ON m.conversation_id = c.id
            WHERE m.read_status = 0 AND m.sender_type = 'admin' AND c.participant_id = ?
        ");
        $stmt->execute([$user['user_id']]);
    }
    
    echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
}

function getSupportStats($user) {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        return;
    }
    
    $pdo = getDB();
    
    $stats = [];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM chat_conversations");
    $stats['total_conversations'] = $stmt->fetch()['count'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM chat_conversations WHERE status = 'open'");
    $stats['open_conversations'] = $stmt->fetch()['count'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM chat_conversations WHERE status = 'assigned'");
    $stats['assigned_conversations'] = $stmt->fetch()['count'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM chat_conversations WHERE status = 'closed'");
    $stats['closed_conversations'] = $stmt->fetch()['count'];
    
    $stmt = $pdo->query("
        SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_response_time
        FROM chat_conversations WHERE status = 'closed'
    ");
    $stats['avg_response_time'] = round($stmt->fetch()['avg_response_time'] ?? 0, 1);
    
    echo json_encode($stats);
}

function getAvailableAdmins($user) {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        return;
    }
    
    $pdo = getDB();
    
    $stmt = $pdo->query("
        SELECT id, nom, prenom, email 
        FROM cp2i_users 
        WHERE role = 'admin' 
        ORDER BY prenom, nom
    ");
    
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

function sendMessageWithImages($user) {
    $pdo = getDB();
    
    try {
        $conversationId = $_POST['conversation_id'];
        $message = $_POST['message'] ?? '';
        
        // Vérifier l'accès
        $stmt = $pdo->prepare("
            SELECT * FROM chat_conversations 
            WHERE id = ? AND (participant_id = ? OR ? = 'admin')
        ");
        $stmt->execute([$conversationId, $user['user_id'], $user['role']]);
        
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode(['error' => 'Accès refusé']);
            return;
        }
        
        // Traiter les images
        $imageUrls = [];
        foreach ($_FILES as $key => $file) {
            if (strpos($key, 'image_') === 0) {
                $imageUrl = uploadImage($file, 'chat');
                if ($imageUrl) {
                    $imageUrls[] = $imageUrl;
                }
            }
        }
        
        $senderType = $user['role'] === 'admin' ? 'admin' : 'participant';
        
        // Stocker le message et les images séparément
        $stmt = $pdo->prepare("
            INSERT INTO chat_messages (conversation_id, sender_id, sender_type, message, images, timestamp, read_status)
            VALUES (?, ?, ?, ?, ?, NOW(), 0)
        ");
        $stmt->execute([$conversationId, $user['user_id'], $senderType, $message, json_encode($imageUrls)]);
        
        // Mettre à jour la conversation
        $stmt = $pdo->prepare("UPDATE chat_conversations SET updated_at = NOW() WHERE id = ?");
        $stmt->execute([$conversationId]);
        
        echo json_encode(['success' => true, 'images' => $imageUrls]);
        
    } catch (Exception $e) {
        echo json_encode(['error' => 'Erreur envoi message avec images: ' . $e->getMessage()]);
    }
}

function createConversationWithImages($user) {
    $pdo = getDB();
    
    try {
        $subject = $_POST['subject'] ?? 'Support';
        $initialMessage = $_POST['initial_message'] ?? '';
        $userId = $user['user_id'];
        
        $pdo->beginTransaction();
        
        // Créer la conversation
        $stmt = $pdo->prepare("
            INSERT INTO chat_conversations (participant_id, subject, status, priority, created_at, updated_at)
            VALUES (?, ?, 'open', 'medium', NOW(), NOW())
        ");
        $stmt->execute([$userId, $subject]);
        $conversationId = $pdo->lastInsertId();
        
        // Traiter les images
        $imageUrls = [];
        foreach ($_FILES as $key => $file) {
            if (strpos($key, 'image_') === 0) {
                $imageUrl = uploadImage($file, 'chat');
                if ($imageUrl) {
                    $imageUrls[] = $imageUrl;
                }
            }
        }
        
        // Créer le message initial avec images séparées
        $stmt = $pdo->prepare("
            INSERT INTO chat_messages (conversation_id, sender_id, sender_type, message, images, timestamp, read_status)
            VALUES (?, ?, 'participant', ?, ?, NOW(), 0)
        ");
        $stmt->execute([$conversationId, $userId, $initialMessage, json_encode($imageUrls)]);
        
        $pdo->commit();
        echo json_encode(['success' => true, 'conversation_id' => $conversationId, 'images' => $imageUrls]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['error' => 'Erreur création conversation avec images: ' . $e->getMessage()]);
    }
}

function uploadImage($file, $type = 'chat') {
    // Dossier uploads directement dans public_html
    $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/uploads/' . $type . '/';
    
    // Créer le dossier s'il n'existe pas
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Vérifications de sécurité
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!in_array($file['type'], $allowedTypes)) {
        return false;
    }
    
    if ($file['size'] > $maxSize) {
        return false;
    }
    
    // Générer un nom unique
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    // Déplacer le fichier
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        return 'uploads/' . $type . '/' . $filename;
    }
    
    return false;
}

function deleteConversation($user, $data) {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé - Seuls les admins peuvent supprimer']);
        return;
    }
    
    $pdo = getDB();
    
    try {
        $conversationId = $data['conversation_id'];
        
        if (!$conversationId) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de conversation manquant']);
            return;
        }
        
        $pdo->beginTransaction();
        
        // Supprimer d'abord tous les messages de la conversation
        $stmt = $pdo->prepare("DELETE FROM chat_messages WHERE conversation_id = ?");
        $stmt->execute([$conversationId]);
        
        // Ensuite supprimer la conversation
        $stmt = $pdo->prepare("DELETE FROM chat_conversations WHERE id = ?");
        $stmt->execute([$conversationId]);
        
        // Vérifier si la suppression a eu lieu
        if ($stmt->rowCount() > 0) {
            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Conversation supprimée avec succès']);
        } else {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['error' => 'Conversation non trouvée']);
        }
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
    }
}
?>