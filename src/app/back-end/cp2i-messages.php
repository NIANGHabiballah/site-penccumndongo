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
    } elseif ($action === 'send_with_images') {
        // Seuls les admins peuvent envoyer des messages
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Accès refusé']);
            exit;
        }
        
        sendMessageWithImages($user);
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
            // Inclure les messages collectifs ET les messages individuels
            $stmt = $pdo->prepare("
                SELECT DISTINCT m.id, m.subject, m.content, m.created_at, m.send_to_all,
                       u.prenom as sender_prenom, u.nom as sender_nom, 
                       mr.read_at,
                       CASE WHEN mr.read_at IS NOT NULL THEN 1 ELSE 0 END as is_read
                FROM cp2i_messages m
                LEFT JOIN cp2i_users u ON m.sender_id = u.id
                LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id
                WHERE (m.send_to_all = 1 OR mr.recipient_id = ?)
                  AND m.sender_id != ?
                ORDER BY m.created_at DESC
            ");
            $stmt->execute([$user['user_id'], $user['user_id']]);
            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Pour les messages collectifs, vérifier/créer l'entrée dans message_recipients
            foreach ($messages as &$message) {
                if ($message['send_to_all'] == 1 && !$message['read_at']) {
                    // Créer l'entrée si elle n'existe pas
                    $checkStmt = $pdo->prepare("SELECT id FROM cp2i_message_recipients WHERE message_id = ? AND recipient_id = ?");
                    $checkStmt->execute([$message['id'], $user['user_id']]);
                    
                    if (!$checkStmt->fetch()) {
                        $insertStmt = $pdo->prepare("INSERT IGNORE INTO cp2i_message_recipients (message_id, recipient_id) VALUES (?, ?)");
                        $insertStmt->execute([$message['id'], $user['user_id']]);
                    }
                }
            }
            
            error_log("Messages récupérés pour utilisateur {$user['user_id']}: " . count($messages));
            
            echo json_encode(['success' => true, 'messages' => $messages]);
        }
        
    } catch (Exception $e) {
        error_log('Error in getMessages: ' . $e->getMessage());
        error_log('Stack trace: ' . $e->getTraceAsString());
        echo json_encode([
            'success' => false, 
            'messages' => [],
            'error' => 'Erreur lors de la récupération des messages'
        ]);
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
    
    // Log des données reçues
    error_log('sendMessage - Données reçues: ' . json_encode([
        'user_id' => $user['user_id'],
        'subject' => $subject,
        'content_length' => strlen($content),
        'send_to_all' => $send_to_all,
        'recipients' => $data['recipients'] ?? []
    ]));
    
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
        
        error_log('Message inséré avec ID: ' . $message_id);
        
        $recipient_count = 0;
        
        if ($send_to_all) {
            // Envoyer à tous les utilisateurs sauf l'expéditeur
            $stmt = $db->prepare("SELECT id FROM cp2i_users WHERE id != ?");
            $stmt->execute([$user['user_id']]);
            $all_recipients = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            error_log('Destinataires pour envoi collectif: ' . json_encode($all_recipients));
            
            // Insérer chaque destinataire une seule fois
            foreach ($all_recipients as $recipient_id) {
                $stmt = $db->prepare("INSERT INTO cp2i_message_recipients (message_id, recipient_id) VALUES (?, ?)");
                $stmt->execute([$message_id, $recipient_id]);
            }
            $recipient_count = count($all_recipients);
        } else {
            $recipients = $data['recipients'] ?? [];
            
            error_log('Destinataires sélectionnés: ' . json_encode($recipients));
            
            // Vérifier que des destinataires sont fournis
            if (empty($recipients)) {
                error_log('Aucun destinataire fourni pour message individuel');
                http_response_code(400);
                echo json_encode(['error' => 'Aucun destinataire sélectionné pour ce message individuel']);
                return;
            }
            
            // Insérer les destinataires sélectionnés avec transaction
            $db->beginTransaction();
            $valid_recipients = 0;
            
            try {
                foreach ($recipients as $recipient_id) {
                    // Vérifier que le destinataire existe et n'est pas l'expéditeur
                    $stmt = $db->prepare("SELECT id, prenom, nom, email FROM cp2i_users WHERE id = ? AND id != ?");
                    $stmt->execute([$recipient_id, $user['user_id']]);
                    $recipient = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($recipient) {
                        // Insérer le destinataire
                        $stmt = $db->prepare("INSERT INTO cp2i_message_recipients (message_id, recipient_id) VALUES (?, ?)");
                        $stmt->execute([$message_id, $recipient_id]);
                        $valid_recipients++;
                        
                        error_log("Destinataire ajouté: {$recipient['prenom']} {$recipient['nom']} (ID: {$recipient_id})");
                    } else {
                        error_log('Destinataire invalide ou expéditeur: ' . $recipient_id);
                    }
                }
                
                if ($valid_recipients === 0) {
                    throw new Exception('Aucun destinataire valide trouvé');
                }
                
                $db->commit();
                $recipient_count = $valid_recipients;
                
                error_log("Message individuel envoyé avec succès à $valid_recipients destinataires");
                
            } catch (Exception $e) {
                $db->rollback();
                error_log('Erreur lors de l\'ajout des destinataires: ' . $e->getMessage());
                http_response_code(500);
                echo json_encode(['error' => 'Erreur lors de l\'ajout des destinataires: ' . $e->getMessage()]);
                return;
            }
        }
        
        // Vérification finale
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM cp2i_message_recipients WHERE message_id = ?");
        $stmt->execute([$message_id]);
        $final_count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        error_log("Vérification finale: $final_count destinataires dans la base pour le message $message_id");
        
        echo json_encode([
            'success' => true,
            'message' => "Message envoyé avec succès à $recipient_count destinataire(s)",
            'message_id' => $message_id,
            'recipients_added' => $recipient_count,
            'final_count' => $final_count
        ]);
        
    } catch (Exception $e) {
        error_log('Erreur sendMessage: ' . $e->getMessage());
        error_log('Stack trace: ' . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode([
            'error' => 'Erreur lors de l\'envoi du message: ' . $e->getMessage(),
            'debug_info' => [
                'user_id' => $user['user_id'],
                'subject' => $subject,
                'send_to_all' => $send_to_all,
                'recipients_provided' => count($data['recipients'] ?? [])
            ]
        ]);
    }
}

function sendMessageWithImages($user) {
    $db = getDB();
    
    $subject = $_POST['subject'] ?? '';
    $content = $_POST['content'] ?? '';
    $send_to_all = $_POST['send_to_all'] === 'true';
    
    if (!$subject || !$content) {
        http_response_code(400);
        echo json_encode(['error' => 'Sujet et contenu requis']);
        return;
    }
    
    try {
        // Traiter les images
        $imageUrls = [];
        foreach ($_FILES as $key => $file) {
            if (strpos($key, 'image_') === 0) {
                $imageUrl = uploadImage($file, 'messages');
                if ($imageUrl) {
                    $imageUrls[] = $imageUrl;
                }
            }
        }
        
        // Ajouter les images au contenu
        $finalContent = $content;
        if (!empty($imageUrls)) {
            $finalContent .= '\n[IMAGES]' . json_encode($imageUrls);
        }
        
        // Insérer le message
        $stmt = $db->prepare("INSERT INTO cp2i_messages (sender_id, subject, content, images, send_to_all) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$user['user_id'], $subject, $finalContent, json_encode($imageUrls), $send_to_all ? 1 : 0]);
        $message_id = $db->lastInsertId();
        
        $recipient_count = 0;
        
        if ($send_to_all) {
            $stmt = $db->prepare("SELECT id FROM cp2i_users WHERE id != ?");
            $stmt->execute([$user['user_id']]);
            $all_recipients = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            foreach ($all_recipients as $recipient_id) {
                $stmt = $db->prepare("INSERT INTO cp2i_message_recipients (message_id, recipient_id) VALUES (?, ?)");
                $stmt->execute([$message_id, $recipient_id]);
            }
            $recipient_count = count($all_recipients);
        } else {
            // Pour les messages avec images individuels
            $recipients = json_decode($_POST['recipients'] ?? '[]', true);
            
            if (!empty($recipients)) {
                foreach ($recipients as $recipient_id) {
                    $stmt = $db->prepare("SELECT id FROM cp2i_users WHERE id = ?");
                    $stmt->execute([$recipient_id]);
                    if ($stmt->fetch()) {
                        $stmt = $db->prepare("INSERT INTO cp2i_message_recipients (message_id, recipient_id) VALUES (?, ?)");
                        $stmt->execute([$message_id, $recipient_id]);
                    }
                }
                $recipient_count = count($recipients);
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => "Message avec images envoyé à $recipient_count destinataire(s)",
            'images' => $imageUrls
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de l\'envoi du message avec images']);
    }
}

function uploadImage($file, $type = 'messages') {
    // Dossier uploads directement dans public_html
    $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/uploads/' . $type . '/';
    
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $maxSize = 5 * 1024 * 1024;
    
    if (!in_array($file['type'], $allowedTypes)) {
        return false;
    }
    
    if ($file['size'] > $maxSize) {
        return false;
    }
    
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        return 'uploads/' . $type . '/' . $filename;
    }
    
    return false;
}
?>