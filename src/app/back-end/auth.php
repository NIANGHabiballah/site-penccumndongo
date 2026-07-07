<?php
require_once 'config.php';
setCorsHeaders();

$data = json_decode(file_get_contents("php://input"), true);
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        register($data);
        break;
    case 'login':
        login($data);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Action non valide']);
}

function register($data) {
    $pdo = getDB();
    
    $email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
    $password = password_hash($data['password'], PASSWORD_DEFAULT);
    $nom = htmlspecialchars($data['nom']);
    $prenom = htmlspecialchars($data['prenom']);
    $telephone = htmlspecialchars($data['telephone'] ?? '');
    $role = $data['role'] ?? 'participant';
    
    if (!$email) {
        echo json_encode(['error' => 'Email invalide']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO users (email, password, nom, prenom, telephone, role) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$email, $password, $nom, $prenom, $telephone, $role]);
        
        echo json_encode(['success' => true, 'message' => 'Inscription réussie']);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            echo json_encode(['error' => 'Email déjà utilisé']);
        } else {
            echo json_encode(['error' => 'Erreur d\'inscription']);
        }
    }
}

function login($data) {
    $pdo = getDB();
    
    $email = filter_var($data['email'], FILTER_VALIDATE_EMAIL);
    $password = $data['password'];
    
    if (!$email) {
        echo json_encode(['error' => 'Email invalide']);
        return;
    }
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || !password_verify($password, $user['password'])) {
        echo json_encode(['error' => 'Identifiants incorrects']);
        return;
    }
    
    // Mise à jour dernière connexion
    $stmt = $pdo->prepare("UPDATE users SET derniere_connexion = NOW() WHERE id = ?");
    $stmt->execute([$user['id']]);
    
    // Génération JWT simple
    $payload = [
        'userId' => $user['id'],
        'role' => $user['role'],
        'exp' => time() + 86400 // 24h
    ];
    
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload_encoded = base64_encode(json_encode($payload));
    $signature = hash_hmac('sha256', "$header.$payload_encoded", JWT_SECRET, true);
    $signature_encoded = base64_encode($signature);
    
    $token = "$header.$payload_encoded.$signature_encoded";
    
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
?>