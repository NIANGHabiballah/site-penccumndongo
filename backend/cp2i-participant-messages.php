<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Vérifier si le fichier de config existe
if (!file_exists('config/database.php')) {
    echo json_encode(['error' => 'Configuration de base de données manquante']);
    exit;
}

require_once 'config/database.php';

$action = $_GET['action'] ?? 'messages';

$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    echo json_encode(['error' => 'Token manquant']);
    exit;
}

$token = $matches[1];
$tokenParts = explode('.', $token);
if (count($tokenParts) !== 3) {
    echo json_encode(['error' => 'Token invalide']);
    exit;
}

$payload = json_decode(base64_decode($tokenParts[1]), true);
if (!$payload) {
    echo json_encode(['error' => 'Token corrompu']);
    exit;
}

$userId = $payload['user_id'] ?? $payload['userId'] ?? null;
if (!$userId) {
    echo json_encode(['error' => 'ID utilisateur manquant']);
    exit;
}

try {
    if ($action === 'unread_count') {
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM cp2i_messages WHERE (destinataire_id = ? OR destinataire_id IS NULL) AND lu = 0");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'count' => (int)$result['count']
        ]);
    } else {
        $stmt = $pdo->prepare("
            SELECT 
                id,
                COALESCE(sujet, 'Message') as subject,
                contenu as content,
                date_envoi as created_at,
                lu as read_at
            FROM cp2i_messages 
            WHERE destinataire_id = ? OR destinataire_id IS NULL
            ORDER BY date_envoi DESC
        ");
        
        $stmt->execute([$userId]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($messages as &$message) {
            $message['is_read'] = $message['read_at'] == 1;
            $message['read_at'] = $message['read_at'] == 1 ? $message['created_at'] : null;
        }
        
        echo json_encode([
            'success' => true,
            'messages' => $messages
        ]);
    }
    
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur base de données: ' . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(['error' => 'Erreur serveur: ' . $e->getMessage()]);
}
?>