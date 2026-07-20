<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = ['http://localhost:4200', 'https://penccumndongo.com', 'http://penccumndongo.com'];
if (in_array($origin, $allowed)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *");
}
header('Content-Type: application/json');
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// Vérification clé admin
$admin_key = $_GET['admin_key'] ?? $_POST['admin_key'] ?? '';
if ($admin_key !== 'PencBoostAdmin2026') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

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

$action = $_GET['action'] ?? '';

// ─── GET : liste des inscrits par module ──────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'inscrits') {
    $module = $_GET['module'] ?? '';
    $where = $module ? "WHERE module = ?" : "";
    $params = $module ? [$module] : [];
    $stmt = $pdo->prepare("SELECT id, nom, email, telephone, module FROM inscriptions_pencboost $where ORDER BY module, nom");
    $stmt->execute($params);
    echo json_encode(['success' => true, 'inscrits' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

// ─── POST : envoyer les emails ────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'envoyer') {
    $data = json_decode(file_get_contents('php://input'), true);

    $sujet      = trim($data['sujet'] ?? '');
    $corps      = trim($data['corps'] ?? '');
    $destinataires = $data['destinataires'] ?? []; // [{nom, email, module}]

    if (!$sujet || !$corps || empty($destinataires)) {
        echo json_encode(['success' => false, 'message' => 'Sujet, corps et destinataires sont obligatoires.']);
        exit;
    }

    $modules_info = [
        'leadership'    => ['label' => 'Leadership & Développement Personnel', 'date' => 'Lundi 20 juillet 2026 · 18h–20h'],
        'design'        => ['label' => 'Design Graphique',                      'date' => 'Mardi 21 juillet 2026 · 19h–21h'],
        'marketing'     => ['label' => 'Marketing Digital',                     'date' => 'Mercredi 22 juillet 2026 · 20h–22h'],
        'numerique-ia'  => ['label' => 'Compétences Numériques & IA',           'date' => 'Jeudi 23 juillet 2026 · 18h–20h'],
        'employabilite' => ['label' => 'Employabilité, Entrepreneuriat & Insertion Pro.', 'date' => 'Vendredi 24 juillet 2026 · 16h–18h'],
        'bureautique'   => ['label' => 'Initiation à la Bureautique & Informatique', 'date' => 'Samedi 25 juillet 2026 · 10h–12h'],
        'poesie'        => ['label' => 'Poésie & Arts Visuels',                 'date' => 'Dimanche 26 juillet 2026 · 10h–12h'],
    ];

    $envoyes = 0;
    $echecs  = [];

    foreach ($destinataires as $dest) {
        $nom    = $dest['nom']    ?? '';
        $email  = $dest['email']  ?? '';
        $module = $dest['module'] ?? '';

        if (!$email) continue;

        $module_label = $modules_info[$module]['label'] ?? $module;
        $module_date  = $modules_info[$module]['date']  ?? '';

        // Remplacer les variables dans sujet et corps
        $vars = [
            '{nom}'          => $nom,
            '{email}'        => $email,
            '{module}'       => $module_label,
            '{date_module}'  => $module_date,
            '{lien_presence}' => 'https://penccumndongo.com/presence/' . $module,
        ];

        $sujet_final = str_replace(array_keys($vars), array_values($vars), $sujet);
        $corps_final = str_replace(array_keys($vars), array_values($vars), $corps);

        // Template HTML
        $html = "
<!DOCTYPE html>
<html lang='fr'>
<head><meta charset='UTF-8'>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f4; }
  .container { max-width: 600px; margin: 0 auto; background: white; }
  .header { background: linear-gradient(135deg, #001B36, #0380C2); color: white; padding: 28px 30px; text-align: center; }
  .header h1 { margin: 0 0 6px; font-size: 1.3rem; }
  .header p { margin: 0; font-size: 0.88rem; opacity: 0.85; }
  .content { padding: 30px; color: #1a2332; line-height: 1.7; }
  .module-badge { display: inline-block; background: #eff6ff; border-left: 4px solid #0380C2; padding: 10px 16px; border-radius: 6px; margin: 16px 0; font-weight: 700; color: #0380C2; }
  .footer { background: #f8f9fa; padding: 18px 30px; text-align: center; font-size: 0.78rem; color: #888; border-top: 1px solid #eee; }
  .footer a { color: #0380C2; text-decoration: none; }
  pre { white-space: pre-wrap; font-family: Arial, sans-serif; margin: 0; }
</style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h1>PENCCUM NDONGO · Penc'Boost 2026</h1>
      <p>Programme de formations gratuites · 2ème Édition</p>
    </div>
    <div class='content'>
      <p>Bonjour <strong>" . htmlspecialchars($nom) . "</strong>,</p>
      <div class='module-badge'>📚 " . htmlspecialchars($module_label) . " · " . htmlspecialchars($module_date) . "</div>
      <div style='white-space:pre-line;font-family:Arial,sans-serif;font-size:0.95rem;line-height:1.7;'>" . htmlspecialchars($corps_final) . "</div>
    </div>
    <div class='footer'>
      <p style='margin:0 0 6px;font-size:0.82rem;color:#555;'>© Penccum Ndongo · Penc'Boost 2026 · <a href='https://penccumndongo.com' style='color:#0380C2;text-decoration:none;'>penccumndongo.com</a></p>
      <p style='margin:0 0 14px;font-size:0.78rem;color:#888;'>📧 pencc.penccumndongo@gmail.com &nbsp;·&nbsp; 📞 +221 76 841 54 14</p>
      <table cellpadding='0' cellspacing='0' border='0' style='margin:0 auto 10px;'>
        <tr>
          <td style='padding:0 5px;'>
            <a href='https://www.facebook.com/share/1Ce2vCmuuV/?mibextid=wwXIfr' target='_blank' style='display:inline-block;width:36px;height:36px;background:#1877F2;border-radius:50%;text-align:center;line-height:36px;text-decoration:none;font-size:16px;color:white;'>F</a>
          </td>
          <td style='padding:0 5px;'>
            <a href='https://www.instagram.com/penccumndongo?igsh=MXIzZ2FremxqeG9xdg%3D%3D&utm_source=qr' target='_blank' style='display:inline-block;width:36px;height:36px;background:radial-gradient(circle at 30% 107%,#fdf497 0%,#fd5949 45%,#d6249f 60%,#285AEB 90%);border-radius:50%;text-align:center;line-height:36px;text-decoration:none;font-size:15px;color:white;'>I</a>
          </td>
          <td style='padding:0 5px;'>
            <a href='https://x.com/penccumndongo?s=21' target='_blank' style='display:inline-block;width:36px;height:36px;background:#000000;border-radius:50%;text-align:center;line-height:36px;text-decoration:none;font-size:14px;color:white;font-weight:bold;'>X</a>
          </td>
          <td style='padding:0 5px;'>
            <a href='https://www.linkedin.com/company/penccum-ndongo/' target='_blank' style='display:inline-block;width:36px;height:36px;background:#0A66C2;border-radius:50%;text-align:center;line-height:36px;text-decoration:none;font-size:14px;color:white;font-weight:bold;'>in</a>
          </td>
          <td style='padding:0 5px;'>
            <a href='https://www.tiktok.com/@penccum.ndongo?_t=ZM-8xRXEUCzSdC&_r=1' target='_blank' style='display:inline-block;width:36px;height:36px;background:#010101;border-radius:50%;text-align:center;line-height:36px;text-decoration:none;font-size:13px;color:white;font-weight:bold;'>T</a>
          </td>
          <td style='padding:0 5px;'>
            <a href='https://www.youtube.com/@PENCCUMNDONGO' target='_blank' style='display:inline-block;width:36px;height:36px;background:#FF0000;border-radius:50%;text-align:center;line-height:36px;text-decoration:none;font-size:15px;color:white;font-weight:bold;'>Y</a>
          </td>
          <td style='padding:0 5px;'>
            <a href='https://chat.whatsapp.com/H2HX0arxjCA70EgrcbRWUG?mode=gi_t' target='_blank' style='display:inline-block;width:36px;height:36px;background:#25D366;border-radius:50%;text-align:center;line-height:36px;text-decoration:none;font-size:13px;color:white;font-weight:bold;'>Wts</a>
          </td>
        </tr>
      </table>
      <p style='margin:6px 0 0;font-size:0.72rem;color:#aaa;'>Rejoignez notre communauté Penc'Boost sur WhatsApp</p>
    </div>
  </div>
</body>
</html>";

        $ok = sendEmailViaSMTP($email, $sujet_final, $html, "Penccum Ndongo · Penc'Boost");
        if ($ok === true) {
            $envoyes++;
        } else {
            $echecs[] = ['email' => $email, 'erreur' => $ok];
        }
    }

    echo json_encode([
        'success' => true,
        'envoyes' => $envoyes,
        'echecs'  => $echecs,
        'message' => "$envoyes email(s) envoyé(s) avec succès." . (count($echecs) ? ' Échecs : ' . implode(', ', $echecs) : '')
    ]);
    exit;
}

echo json_encode(['success' => false, 'message' => 'Action non reconnue.']);
