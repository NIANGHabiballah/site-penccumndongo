<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST') {
    $action = $_GET['action'] ?? '';
    
    if ($action === 'request') {
        requestPasswordReset($input);
    } elseif ($action === 'reset') {
        resetPassword($input);
    }
}

function requestPasswordReset($data) {
    $db = getDB();
    $email = $data['email'] ?? '';
    
    if (!$email) {
        http_response_code(400);
        echo json_encode(['error' => 'Email requis']);
        return;
    }
    
    // Vérifier si l'email existe
    $stmt = $db->prepare("SELECT id, nom, prenom FROM cp2i_users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'Email non trouvé']);
        return;
    }
    
    // Générer token de réinitialisation
    $resetToken = bin2hex(random_bytes(32));
    $expiry = date('Y-m-d H:i:s', time() + 3600); // 1 heure
    
    // Stocker le token
    $stmt = $db->prepare("UPDATE cp2i_users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?");
    $stmt->execute([$resetToken, $expiry, $email]);
    
    // Envoyer email
    sendResetEmail($email, $user['nom'], $user['prenom'], $resetToken);
    
    echo json_encode([
        'success' => true,
        'message' => 'Un lien de réinitialisation a été envoyé à votre email'
    ]);
}

function resetPassword($data) {
    $db = getDB();
    $token = $data['token'] ?? '';
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    
    if (!$token || !$email || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Données manquantes']);
        return;
    }
    
    // Vérifier le token
    $stmt = $db->prepare("SELECT id FROM cp2i_users WHERE email = ? AND reset_token = ? AND reset_token_expiry > NOW()");
    $stmt->execute([$email, $token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(400);
        echo json_encode(['error' => 'Token invalide ou expiré']);
        return;
    }
    
    // Mettre à jour le mot de passe
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $db->prepare("UPDATE cp2i_users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?");
    $stmt->execute([$hashedPassword, $user['id']]);
    
    // Enregistrer l'action
    logAction($user['id'], 'password_reset', 'Réinitialisation de mot de passe');
    
    echo json_encode([
        'success' => true,
        'message' => 'Mot de passe réinitialisé avec succès'
    ]);
}

function sendResetEmail($email, $nom, $prenom, $token) {
    $resetUrl = "https://penccumndongo.com/reset-password?token=" . $token . "&email=" . urlencode($email);
    
    $subject = "CP2i - Réinitialisation de mot de passe";
    $message = "
    <html>
    <head>
        <title>Réinitialisation de mot de passe CP2i</title>
    </head>
    <body>
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
            <h2 style='color: #FF7F1A;'>Réinitialisation de mot de passe</h2>
            <p>Bonjour $prenom $nom,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe CP2i.</p>
            <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
            <p style='text-align: center; margin: 30px 0;'>
                <a href='$resetUrl' style='background: #FF7F1A; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;'>Réinitialiser mon mot de passe</a>
            </p>
            <p>Ce lien expire dans 1 heure.</p>
            <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
            <hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;'>
            <p style='color: #666; font-size: 12px;'>Penccum Ndongo - CP2i</p>
        </div>
    </body>
    </html>
    ";
    
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8\r\n";
    $headers .= "From: CP2i <noreply@penccumndongo.com>\r\n";
    
    mail($email, $subject, $message, $headers);
}
?>