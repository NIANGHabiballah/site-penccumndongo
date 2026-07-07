<?php
require_once 'config.php';
require_once 'gmail-smtp.php';
setCorsHeaders();

// Fonction centralisée pour gérer les mots de passe
function setUserPassword($db, $userId, $plainPassword, $role) {
    $hashedPassword = password_hash($plainPassword, PASSWORD_DEFAULT);
    $plainPasswordToStore = ($role === 'admin' || $role === 'correcteur') ? $plainPassword : null;
    
    $stmt = $db->prepare("UPDATE cp2i_users SET password = ?, plain_password = ? WHERE id = ?");
    return $stmt->execute([$hashedPassword, $plainPasswordToStore, $userId]);
}

// Fonction pour créer un utilisateur avec mot de passe cohérent
function createUserWithPassword($db, $userData) {
    $hashedPassword = password_hash($userData['password'], PASSWORD_DEFAULT);
    $plainPasswordToStore = ($userData['role'] === 'admin' || $userData['role'] === 'correcteur') ? $userData['password'] : null;
    
    $stmt = $db->prepare("INSERT INTO cp2i_users (email, password, nom, prenom, telephone, whatsapp, ville, role, email_verified, verification_token, plain_password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?, ?, NOW())");
    
    return $stmt->execute([
        $userData['email'], 
        $hashedPassword, 
        $userData['nom'], 
        $userData['prenom'], 
        $userData['telephone'], 
        $userData['whatsapp'], 
        $userData['ville'], 
        $userData['role'], 
        $userData['verification_token'],
        $plainPasswordToStore
    ]);
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'POST':
        $action = $_GET['action'] ?? '';
        
        if ($action === 'register') {
            registerUser($input);
        } elseif ($action === 'login') {
            loginUser($input);
        } elseif ($action === 'refresh') {
            refreshToken();
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
    $whatsapp = $data['whatsapp'] ?? '';
    $ville = $data['ville'] ?? '';
    $role = $data['role'] ?? 'participant';
    
    // Validation détaillée des champs
    if (!$email) {
        http_response_code(400);
        echo json_encode(['error' => 'L\'adresse email est requise']);
        return;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Format d\'email invalide']);
        return;
    }
    
    if (!$password || strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Le mot de passe doit contenir au moins 6 caractères']);
        return;
    }
    
    if (!$nom || strlen(trim($nom)) < 1) {
        http_response_code(400);
        echo json_encode(['error' => 'Le nom est requis']);
        return;
    }
    
    if (!$prenom || strlen(trim($prenom)) < 1) {
        http_response_code(400);
        echo json_encode(['error' => 'Le prénom est requis']);
        return;
    }
    
    if (!$telephone) {
        http_response_code(400);
        echo json_encode(['error' => 'Le numéro de téléphone principal est requis']);
        return;
    }
    
    if (!$whatsapp) {
        http_response_code(400);
        echo json_encode(['error' => 'Le numéro WhatsApp est requis']);
        return;
    }
    
    if (!$ville || strlen(trim($ville)) < 3) {
        http_response_code(400);
        echo json_encode(['error' => 'La localisation complète est requise (ville, région, pays)']);
        return;
    }
    
    // Vérifier si l'email existe
    $stmt = $db->prepare("SELECT id FROM cp2i_users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Cette adresse email est déjà utilisée. Utilisez une autre adresse ou connectez-vous.']);
        return;
    }
    
    // Générer token de vérification
    $verificationToken = bin2hex(random_bytes(32));
    
    // Créer l'utilisateur avec mot de passe cohérent
    $userData = [
        'email' => $email,
        'password' => $password,
        'nom' => $nom,
        'prenom' => $prenom,
        'telephone' => $telephone,
        'whatsapp' => $whatsapp,
        'ville' => $ville,
        'role' => $role,
        'verification_token' => $verificationToken
    ];
    
    if (createUserWithPassword($db, $userData)) {
        // Enregistrer l'inscription dans l'historique (si la table existe)
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
    
    // Mettre à jour la dernière connexion
    $stmt = $db->prepare("UPDATE cp2i_users SET last_login = NOW() WHERE id = ?");
    $stmt->execute([$user['id']]);
    
    // Enregistrer la connexion dans l'historique (si la table existe)
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
        'exp' => time() + (2 * 60 * 60) // 2h
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
    
    // Envoyer l'email via Gmail SMTP
    $emailSent = sendEmailViaSMTP($email, $subject, $message, 'CP2i PENCCUM NDONGO');
    error_log('CP2i - Email envoyé via SMTP à ' . $email . ': ' . ($emailSent ? 'SUCCÈS' : 'ÉCHEC'));
    
    return $emailSent;
}

function refreshToken() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
        http_response_code(401);
        echo json_encode(['error' => 'Token manquant']);
        return;
    }
    
    $token = substr($authHeader, 7);
    $userData = validateToken($token);
    
    if (!$userData) {
        http_response_code(401);
        echo json_encode(['error' => 'Token invalide']);
        return;
    }
    
    $newToken = generateToken($userData['user_id'], $userData['email'], $userData['role']);
    
    echo json_encode([
        'success' => true,
        'token' => $newToken
    ]);
}

function validateToken($token) {
    try {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return false;
        
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
        
        if (!$payload || $payload['exp'] < time()) {
            return false;
        }
        
        return $payload;
    } catch (Exception $e) {
        return false;
    }
}
?>