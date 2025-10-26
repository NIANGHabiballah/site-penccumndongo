<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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
    $stmt = $pdo->prepare("
        SELECT 
            id,
            COALESCE(sujet, type) as subject,
            contenu as content,
            date_envoi as created_at,
            lu as read_at
        FROM messages 
        WHERE destinataire_id = ? OR destinataire_id IS NULL
        ORDER BY date_envoi DESC
    ");
    
    $stmt->execute([$userId]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convertir lu (boolean) en read_at (timestamp)
    foreach ($messages as &$message) {
        if ($message['read_at'] == 1) {
            $message['read_at'] = $message['created_at'];
        } else {
            $message['read_at'] = null;
        }
    }
    
    echo json_encode([
        'success' => true,
        'messages' => $messages
    ]);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>