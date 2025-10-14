<?php
require_once 'config.php';

$token = $_GET['token'] ?? '';

if (!$token) {
    showVerificationPage(false, 'Token de vérification manquant');
    exit;
}

$db = getDB();

try {
    // Vérifier le token
    $stmt = $db->prepare("SELECT id, email, nom, prenom FROM cp2i_users WHERE verification_token = ? AND email_verified = FALSE");
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        showVerificationPage(false, 'Token invalide ou compte déjà vérifié');
        exit;
    }
    
    // Activer le compte
    $stmt = $db->prepare("UPDATE cp2i_users SET email_verified = TRUE, verification_token = NULL WHERE id = ?");
    $stmt->execute([$user['id']]);
    
    showVerificationPage(true, 'Votre compte a été vérifié avec succès !', $user);
    
} catch (Exception $e) {
    showVerificationPage(false, 'Erreur lors de la vérification');
}

function showVerificationPage($success, $message, $user = null) {
    $title = $success ? 'Compte vérifié' : 'Erreur de vérification';
    $color = $success ? '#28a745' : '#dc3545';
    $icon = $success ? '✓' : '✗';
    
    echo "<!DOCTYPE html>
    <html lang='fr'>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>$title - CP2i</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 15px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 500px;
                width: 100%;
            }
            .icon {
                width: 80px;
                height: 80px;
                background: $color;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                color: white;
                font-size: 40px;
                font-weight: bold;
            }
            h1 {
                color: #333;
                margin-bottom: 20px;
            }
            p {
                color: #666;
                line-height: 1.6;
                margin-bottom: 30px;
            }
            .btn {
                background: #FF7F1A;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 25px;
                display: inline-block;
                font-weight: 600;
                transition: all 0.3s ease;
            }
            .btn:hover {
                background: #e67e22;
                transform: translateY(-2px);
            }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='icon'>$icon</div>
            <h1>$title</h1>
            <p>$message</p>";
    
    if ($success && $user) {
        echo "<p>Bonjour <strong>{$user['prenom']} {$user['nom']}</strong>,<br>
              Vous pouvez maintenant vous connecter à votre compte CP2i.</p>";
    }
    
    echo "<a href='https://penccumndongo.com/auth/login' class='btn'>Se connecter</a>
        </div>
    </body>
    </html>";
}
?>