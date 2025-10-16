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
    
    // Générer token de vérification
    $verificationToken = bin2hex(random_bytes(32));
    
    // Créer l'utilisateur
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $db->prepare("INSERT INTO cp2i_users (email, password, nom, prenom, telephone, role, email_verified, verification_token, created_at) VALUES (?, ?, ?, ?, ?, ?, FALSE, ?, NOW())");
    
    if ($stmt->execute([$email, $hashedPassword, $nom, $prenom, $telephone, $role, $verificationToken])) {
        // Enregistrer l'inscription dans l'historique
        $userId = $db->lastInsertId();
        logAction($userId, 'register', 'Inscription utilisateur');
        
        // Envoyer email de vérification
        sendVerificationEmail($email, $nom, $prenom, $verificationToken);
        
        echo json_encode([
            'success' => true,
            'message' => 'Inscription réussie ! Veuillez vérifier votre email pour activer votre compte.',
            'email_sent' => true
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
    
    $stmt = $db->prepare("SELECT id, email, password, nom, prenom, role, email_verified FROM cp2i_users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || !password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Email ou mot de passe incorrect']);
        return;
    }
    
    if (!$user['email_verified']) {
        http_response_code(403);
        echo json_encode(['error' => 'Veuillez vérifier votre email avant de vous connecter']);
        return;
    }
    
    // Enregistrer la connexion dans l'historique
    logAction($user['id'], 'login', 'Connexion utilisateur');
    
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

function sendVerificationEmail($email, $nom, $prenom, $token) {
    $verificationUrl = "https://penccumndongo.com/cp2i-verify.php?token=" . $token;
    
    $subject = "CP2i - Vérification de votre compte";
    $message = "
    <html>
    <head>
        <title>Vérification de compte CP2i</title>
    </head>
    <body>
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
            <h2 style='color: #FF7F1A;'>Bienvenue sur CP2i !</h2>
            <p>Bonjour $prenom $nom,</p>
            <p>Merci de vous être inscrit au Concours de Poésie Inédit & Innovant (CP2i).</p>
            <p>Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
            <p style='text-align: center; margin: 30px 0;'>
                <a href='$verificationUrl' style='background: #FF7F1A; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;'>Vérifier mon compte</a>
            </p>
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style='word-break: break-all; color: #666;'>$verificationUrl</p>
            <p>Ce lien expire dans 24 heures.</p>
            <hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;'>
            <p style='color: #666; font-size: 12px;'>Penccum Ndongo - CP2i<br>Email automatique, ne pas répondre.</p>
        </div>
    </body>
    </html>
    ";
    
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: CP2i <noreply@penccumndongo.com>" . "\r\n";
    
    mail($email, $subject, $message, $headers);
}
?>