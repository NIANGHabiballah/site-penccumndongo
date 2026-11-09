<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = ['http://localhost:4200', 'https://penccumndongo.com', 'http://penccumndongo.com'];
if (in_array($origin, $allowed)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *");
}
header('Content-Type: application/json');
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once 'gmail-smtp.php';

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=u122559880_form_contact;charset=utf8',
        'u122559880_root',
        'Tafsir#27',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Connexion DB échouée']);
    exit;
}

// Créer les tables nécessaires
$pdo->exec("
    CREATE TABLE IF NOT EXISTS admin_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        config_key VARCHAR(100) NOT NULL UNIQUE,
        config_value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");
$pdo->exec("
    INSERT IGNORE INTO admin_config (config_key, config_value)
    VALUES ('admin_formations_password', 'PencBoostAdmin2026!')
");
$pdo->exec("
    CREATE TABLE IF NOT EXISTS admin_reset_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        used TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");

$action = $_GET['action'] ?? '';

// ─── POST : envoyer le code par email ─────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'send_code') {
    // Supprimer les anciens codes expirés
    $pdo->exec("DELETE FROM admin_reset_codes WHERE expires_at < NOW() OR used = 1");

    // Générer un code à 6 chiffres
    $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $expires_at = date('Y-m-d H:i:s', time() + 600); // 10 minutes

    $pdo->prepare("INSERT INTO admin_reset_codes (code, expires_at) VALUES (?, ?)")
        ->execute([$code, $expires_at]);

    $html = "
<!DOCTYPE html>
<html lang='fr'>
<head><meta charset='UTF-8'></head>
<body style='font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;'>
  <div style='max-width:520px;margin:30px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);'>
    <div style='background:linear-gradient(135deg,#001B36,#0380C2);padding:28px 30px;text-align:center;'>
      <h1 style='color:white;margin:0 0 6px;font-size:1.2rem;'>PENCCUM NDONGO</h1>
      <p style='color:rgba(255,255,255,0.85);margin:0;font-size:0.88rem;'>Réinitialisation du mot de passe Admin</p>
    </div>
    <div style='padding:32px 30px;text-align:center;'>
      <p style='color:#444;font-size:0.95rem;margin-bottom:24px;'>Voici votre code de réinitialisation :</p>
      <div style='background:#f0f7ff;border:2px dashed #0380C2;border-radius:12px;padding:20px;display:inline-block;margin-bottom:24px;'>
        <span style='font-size:2.5rem;font-weight:900;letter-spacing:10px;color:#001B36;'>{$code}</span>
      </div>
      <p style='color:#e74c3c;font-size:0.85rem;font-weight:600;margin-bottom:8px;'>⏱ Ce code expire dans <strong>10 minutes</strong>.</p>
      <p style='color:#888;font-size:0.8rem;'>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
    </div>
    <div style='background:#f8f9fa;padding:16px 30px;text-align:center;border-top:1px solid #eee;'>
      <p style='margin:0;font-size:0.75rem;color:#aaa;'>© Penccum Ndongo · <a href='https://penccumndongo.com' style='color:#0380C2;text-decoration:none;'>penccumndongo.com</a></p>
    </div>
  </div>
</body>
</html>";

    $ok = sendEmailViaSMTP(
        'pencc.penccumndongo@gmail.com',
        'Code de réinitialisation — Admin Formations',
        $html,
        'Penccum Ndongo'
    );

    if ($ok === true) {
        echo json_encode(['success' => true, 'message' => 'Code envoyé à pencc.penccumndongo@gmail.com']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Erreur envoi email : ' . $ok]);
    }
    exit;
}

// ─── POST : vérifier le code et changer le mot de passe ───────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'verify_code') {
    $data = json_decode(file_get_contents('php://input'), true);
    $code         = trim($data['code'] ?? '');
    $new_password = trim($data['new_password'] ?? '');

    if (strlen($new_password) < 8) {
        echo json_encode(['success' => false, 'error' => 'Le mot de passe doit contenir au moins 8 caractères.']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id FROM admin_reset_codes WHERE code = ? AND expires_at > NOW() AND used = 0 ORDER BY id DESC LIMIT 1");
    $stmt->execute([$code]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode(['success' => false, 'error' => 'Code invalide ou expiré.']);
        exit;
    }

    // Marquer le code comme utilisé
    $pdo->prepare("UPDATE admin_reset_codes SET used = 1 WHERE id = ?")->execute([$row['id']]);

    // Mettre à jour le mot de passe
    $pdo->prepare("UPDATE admin_config SET config_value = ? WHERE config_key = 'admin_formations_password'")
        ->execute([$new_password]);

    echo json_encode(['success' => true, 'message' => 'Mot de passe réinitialisé avec succès.']);
    exit;
}

// ─── GET : récupérer le mot de passe au démarrage ─────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get') {
    $admin_key = $_GET['admin_key'] ?? '';
    if ($admin_key !== 'PencBoostAdmin2026') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }
    $stmt = $pdo->prepare("SELECT config_value FROM admin_config WHERE config_key = 'admin_formations_password'");
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'password' => $row['config_value']]);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Action non reconnue.']);
