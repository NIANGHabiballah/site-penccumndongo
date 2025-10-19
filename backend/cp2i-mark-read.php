<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$messageId = $input['message_id'] ?? null;

if (!$messageId) {
    echo json_encode(['error' => 'ID du message requis']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE messages SET lu = 1 WHERE id = ? AND lu = 0");
    $stmt->execute([$messageId]);
    
    echo json_encode(['success' => true, 'message' => 'Message marqué comme lu']);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>