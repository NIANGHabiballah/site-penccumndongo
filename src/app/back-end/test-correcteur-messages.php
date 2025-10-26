<?php
require_once 'config.php';
header('Content-Type: application/json');

try {
    $db = getDB();
    $correcteurId = 8; // ID d'un correcteur test
    
    // Test simple
    $stmt = $db->prepare("
        SELECT m.*, u.prenom as sender_prenom, u.nom as sender_nom
        FROM cp2i_messages m
        JOIN cp2i_users u ON m.sender_id = u.id
        WHERE m.send_to_all = 1 OR m.id IN (
            SELECT message_id FROM cp2i_message_recipients WHERE recipient_id = ?
        )
        ORDER BY m.created_at DESC
    ");
    $stmt->execute([$correcteurId]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'count' => count($messages),
        'messages' => $messages
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>