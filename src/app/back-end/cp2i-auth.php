<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'POST':
        $action = $_GET['action'] ?? '';
        
        if ($action === 'register') {
            registerUser($input);
        } elseif ($action === 'login') {
            loginUser($input);
        }
        break;
}

function registerUser($data) {
    $db = getDB();
    
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    $nom = $data['nom'] ?? '';
    $prenom = $data['prenom'] ?? '';
    $telephone = $data['telephone'] ?? '';
    $role = $data['role'] ?? 'participant';
    
    if (!$email || !$password || !$nom || !$prenom) {
        http_response_code(400);
        echo json_encode(['error' => 'Données manquantes']);
        return;
    }
    
    // Vérifier si l'email existe
    $stmt = $db->prepare("SELECT id FROM cp2i_users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Email déjà utilisé']);
        return;
    }
    
    // Créer l'utilisateur
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $db->prepare("INSERT INTO cp2i_users (email, password, nom, prenom, telephone, role, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
    
    if ($stmt->execute([$email, $hashedPassword, $nom, $prenom, $telephone, $role])) {
        $userId = $db->lastInsertId();
        $token = generateToken($userId, $email, $role);
        
        echo json_encode([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $userId,
                'email' => $email,
                'nom' => $nom,
                'prenom' => $prenom,
                'role' => $role
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de l\'inscription']);
    }
}

function loginUser($data) {
    $db = getDB();
    
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    
    if (!$email || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Email et mot de passe requis']);
        return;
    }
    
    $stmt = $db->prepare("SELECT id, email, password, nom, prenom, role FROM cp2i_users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Identifiants invalides']);
        return;
    }
    
    $token = generateToken($user['id'], $user['email'], $user['role']);
    
    echo json_encode([
        'success' => true,
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'nom' => $user['nom'],
            'prenom' => $user['prenom'],
            'role' => $user['role']
        ]
    ]);
}

function generateToken($userId, $email, $role) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'user_id' => $userId,
        'email' => $email,
        'role' => $role,
        'exp' => time() + (24 * 60 * 60) // 24h
    ]);
    
    $headerEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $payloadEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, JWT_SECRET, true);
    $signatureEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
}
?>