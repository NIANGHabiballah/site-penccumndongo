<?php
require_once 'config.php';
setCorsHeaders();

$payload = verifyToken();
$messageId = $_POST['message_id'] ?? '';

if (!$messageId) {
    echo json_encode(['error' => 'ID message requis']);
    exit;
}

try {
    $pdo = getDB();
    
    $stmt = $pdo->prepare("
        UPDATE cp2i_messages 
        SET lu = 1 
        WHERE id = ? AND destinataire_id = ?
    ");
    $stmt->execute([$messageId, $payload['userId']]);
    
    echo json_encode(['success' => true]);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>