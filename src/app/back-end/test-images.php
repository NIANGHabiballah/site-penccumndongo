<?php
require_once 'config.php';
header('Content-Type: application/json');
setCorsHeaders();

try {
    $pdo = getDB();
    
    // Récupérer les messages avec images
    $stmt = $pdo->query("
        SELECT id, conversation_id, sender_id, message, images, timestamp
        FROM chat_messages 
        WHERE images IS NOT NULL AND images != '' AND images != 'NULL'
        ORDER BY timestamp DESC 
        LIMIT 10
    ");
    
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'messages_with_images' => $messages,
        'count' => count($messages)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'error' => 'Erreur test images: ' . $e->getMessage()
    ]);
}
?>