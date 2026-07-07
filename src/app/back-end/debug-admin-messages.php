<?php
require_once 'config.php';
header('Content-Type: application/json');
setCorsHeaders();

try {
    // Simuler un admin
    $conversationId = 19; // ID de conversation avec images
    
    $pdo = getDB();
    
    $stmt = $pdo->prepare("
        SELECT m.*, u.nom, u.prenom, m.images
        FROM chat_messages m
        JOIN cp2i_users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.timestamp ASC
    ");
    $stmt->execute([$conversationId]);
    
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'conversation_id' => $conversationId,
        'messages' => $messages,
        'raw_query' => "SELECT m.*, u.nom, u.prenom, m.images FROM chat_messages m JOIN cp2i_users u ON m.sender_id = u.id WHERE m.conversation_id = $conversationId ORDER BY m.timestamp ASC"
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'error' => 'Erreur debug admin: ' . $e->getMessage()
    ]);
}
?>