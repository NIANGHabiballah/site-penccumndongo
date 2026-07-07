<?php
// Configuration base de données CP2i
define('DB_HOST', 'localhost');
define('DB_NAME', 'u122559880_form_contact');
define('DB_USER', 'u122559880_root');
define('DB_PASS', 'Tafsir#27');

// Activer temporairement les logs d'erreur pour déboguer
ini_set('display_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
define('JWT_SECRET', 'cp2i_secret_key_2024');

// Headers CORS
function setCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = [
        'http://localhost:4200',
        'https://penccumndongo.com',
        'http://penccumndongo.com'
    ];
    
    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: *");
    }
    
    header('Content-Type: application/json');
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Credentials: true");
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Connexion PDO
function getDB() {
    try {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8';
        $pdo = new PDO(
            $dsn,
            DB_USER,
            DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur de connexion à la base de données']);
        exit;
    }
}

// Vérification JWT
function verifyToken() {
    $headers = getallheaders();
    $token = '';
    
    // Chercher le token dans différents headers
    if (isset($headers['Authorization'])) {
        $token = $headers['Authorization'];
    } elseif (isset($headers['authorization'])) {
        $token = $headers['authorization'];
    }
    
    if (!$token || strpos($token, 'Bearer ') !== 0) {
        http_response_code(401);
        echo json_encode(['error' => 'Token manquant', 'headers' => array_keys($headers)]);
        exit;
    }
    
    $token = substr($token, 7);
    $parts = explode('.', $token);
    
    if (count($parts) !== 3) {
        http_response_code(401);
        echo json_encode(['error' => 'Format token invalide']);
        exit;
    }
    
    $decoded = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1]));
    $payload = json_decode($decoded, true);
    
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
        http_response_code(401);
        echo json_encode(['error' => 'Token expiré ou invalide']);
        exit;
    }
    
    return $payload;
}


// Fonction pour enregistrer une action dans l'historique (robuste)
function logAction($userId, $action, $description) {
    try {
        $db = getDB();
        // Vérifier si la table existe avant d'insérer
        $stmt = $db->prepare("SHOW TABLES LIKE 'cp2i_history'");
        $stmt->execute();
        if ($stmt->fetch()) {
            $stmt = $db->prepare("
                INSERT INTO cp2i_history (user_id, action, description, created_at) 
                VALUES (?, ?, ?, NOW())
            ");
            $stmt->execute([$userId, $action, $description]);
        }
    } catch (Exception $e) {
        // Ignorer silencieusement les erreurs d'historique
        error_log("Erreur historique (ignorée): " . $e->getMessage());
    }
}
?>