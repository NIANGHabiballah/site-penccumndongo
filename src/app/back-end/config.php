<?php
// Configuration base de données CP2i
define('DB_HOST', 'localhost');
define('DB_NAME', 'u122559880_cp2i_db');
define('DB_USER', 'u122559880_root');
define('DB_PASS', 'Tafsir#27');
define('JWT_SECRET', 'cp2i_secret_key_2024');

// Headers CORS
function setCorsHeaders() {
    header('Content-Type: application/json');
    header("Access-Control-Allow-Origin: https://penccumndongo.com");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Connexion PDO
function getDB() {
    try {
        return new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8',
            DB_USER,
            DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur de connexion']);
        exit;
    }
}

// Vérification JWT
function verifyToken() {
    $headers = getallheaders();
    $token = $headers['Authorization'] ?? '';
    
    if (!$token || !str_starts_with($token, 'Bearer ')) {
        http_response_code(401);
        echo json_encode(['error' => 'Token manquant']);
        exit;
    }
    
    $token = substr($token, 7);
    $decoded = base64_decode(str_replace(['-', '_'], ['+', '/'], explode('.', $token)[1]));
    $payload = json_decode($decoded, true);
    
    if (!$payload || $payload['exp'] < time()) {
        http_response_code(401);
        echo json_encode(['error' => 'Token invalide']);
        exit;
    }
    
    return $payload;
}
?>