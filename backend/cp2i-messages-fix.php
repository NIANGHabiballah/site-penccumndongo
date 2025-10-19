<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config/database.php';

$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'Token manquant']);
    exit;
}

$token = $matches[1];
$tokenParts = explode('.', $token);
$payload = json_decode(base64_decode($tokenParts[1]), true);
$userId = $payload['userId'];

try {
    // Récupérer les messages pour ce participant
    $stmt = $pdo->prepare("
        SELECT 
            id,
            subject,
            content,
            created_at,
            0 as read_at
        FROM textes_complets 
        WHERE send_to_all = 1 
        ORDER BY created_at DESC
    ");
    
    $stmt->execute();
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($messages);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>