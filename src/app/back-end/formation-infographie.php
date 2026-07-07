<?php
require_once 'gmail-smtp.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

// Debug: Log des données reçues
$rawInput = file_get_contents('php://input');
if (empty($rawInput)) {
    // Essayer $_POST si pas de données JSON
    if (!empty($_POST)) {
        $input = $_POST;
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Aucune donnée reçue', 'debug' => 'Raw input empty']);
        exit;
    }
} else {
    $input = json_decode($rawInput, true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Données JSON invalides', 'debug' => substr($rawInput, 0, 100)]);
        exit;
    }
}

// Validation des champs requis
$required = ['firstName', 'lastName', 'email', 'phone', 'profession', 'motivation'];
foreach ($required as $field) {
    if (!isset($input[$field]) || empty(trim($input[$field]))) {
        http_response_code(400);
        echo json_encode(['error' => "Le champ $field est requis"]);
        exit;
    }
}

// Validation email
$email = filter_var($input['email'], FILTER_VALIDATE_EMAIL);
if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'Email invalide']);
    exit;
}

// Sécurisation des données
$data = [
    'firstName' => htmlspecialchars(trim($input['firstName'])),
    'lastName' => htmlspecialchars(trim($input['lastName'])),
    'email' => $email,
    'phone' => htmlspecialchars(trim($input['phone'])),
    'profession' => htmlspecialchars(trim($input['profession'])),
    'format' => htmlspecialchars($input['format'] ?? 'online'),
    'motivation' => htmlspecialchars(trim($input['motivation'])),
    'acceptTerms' => (bool)($input['acceptTerms'] ?? false),
    'submittedAt' => date('Y-m-d H:i:s'),
    'formationType' => 'infographie'
];

// Vérification acceptation des conditions
if (!$data['acceptTerms']) {
    http_response_code(400);
    echo json_encode(['error' => 'Vous devez accepter les conditions générales']);
    exit;
}

// Sauvegarde en base de données
try {
    require_once 'config.php';
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->prepare("
        INSERT INTO formation_infographie_inscriptions 
        (first_name, last_name, email, phone, format, profession, motivation, accept_terms, submitted_at, formation_type) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $data['firstName'],
        $data['lastName'], 
        $data['email'],
        $data['phone'],
        $data['format'],
        $data['profession'],
        $data['motivation'],
        $data['acceptTerms'] ? 1 : 0,
        $data['submittedAt'],
        $data['formationType']
    ]);
    
} catch(Exception $e) {
    error_log('Erreur inscription: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erreur lors de l\'inscription', 'debug' => $e->getMessage()]);
    exit;
}

// Envoyer l'email de confirmation avec template HTML
$to = $data['email'];
$subject = "Inscription confirmée - Formation Infographie Cohorte 3";

$htmlMessage = "
<!DOCTYPE html>
<html lang='fr'>
<head>
    <meta charset='UTF-8'>
    <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css'>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #0085CA; color: white !important; padding: 30px; text-align: center; }
        .header h1, .header p { color: white !important; }
        .header * { color: white !important; }
        .content { padding: 30px; }
        .payment-info { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; color: #000000; }
        .payment-info h3, .payment-info h4, .payment-info p, .payment-info li, .payment-info ul, .payment-info strong { color: #000000 !important; opacity: 1 !important; }
        .btn { background-color: #FF7F32; color: white !important; padding: 12px 24px; text-decoration: none !important; border-radius: 6px; display: inline-block; margin: 10px 0; font-weight: bold; }
        .btn, .btn *, .btn span, .btn i { color: white !important; }
        a.btn, a.btn *, a.btn span, a.btn i { color: white !important; }
        a.btn:visited, a.btn:visited *, a.btn:visited span, a.btn:visited i { color: white !important; }
        a.btn:hover, a.btn:hover *, a.btn:hover span, a.btn:hover i { color: white !important; }
        a.btn:link, a.btn:link *, a.btn:link span, a.btn:link i { color: white !important; }
        a.btn:active, a.btn:active *, a.btn:active span, a.btn:active i { color: white !important; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1><i class='fas fa-palette'></i> PENCCUM NDONGO</h1>
            <p>Formation Infographie Professionnelle</p>
        </div>
        <div class='content'>
            <h2>Bonjour {$data['firstName']} {$data['lastName']},</h2>
            <p>Félicitations ! Votre inscription à la Formation Infographie Cohorte 3 a été confirmée.</p>
            
            <div class='payment-info'>
                <h3><i class='fas fa-money-bill-wave'></i> ÉTAPE SUIVANTE - PAIEMENT</h3>
                <p>Pour finaliser votre inscription, vous devez effectuer le paiement de votre première tranche :</p>
                <ul>
                    <li><strong>Montant :</strong> 12 500 FCFA (première tranche)</li>
                    <li><strong>Date limite :</strong> 13 juin 2026</li>
                    <li><strong>Deuxième tranche :</strong> 12 500 FCFA (à payer à la fin de la formation avant la délivrance des attestations)</li>
                </ul>
                
                <h4><i class='fas fa-credit-card'></i> Moyens de paiement :</h4>
                <ul>
                    <li><strong>Orange Money :</strong> +221 77 629 06 39</li>
                    <li><strong>Wave :</strong> +221 77 629 06 39</li>
                    <li><strong>Free Money :</strong> +221 77 629 06 39</li>
                </ul>
                
                <p><strong><i class='fas fa-exclamation-triangle'></i> Important :</strong> Envoyez-nous une capture d'écran de votre paiement par WhatsApp pour confirmation.</p>
                
                <a href='https://wa.me/221776290639?text=Bonjour%20PENCCUM%20NDONGO,%20je%20viens%20de%20finaliser%20mon%20inscription%20%C3%A0%20la%20Formation%20Infographie%20Cohorte%203.%20Je%20vous%20envoie%20ma%20capture%20d%27%C3%A9cran%20de%20paiement%20de%20la%20premi%C3%A8re%20tranche%20(12%20500%20FCFA)%20pour%20validation.%20Merci.' class='btn' style='color: white !important; text-decoration: none !important; background-color: #FF7F32 !important;'><i class='fab fa-whatsapp' style='color: white !important;'></i> <span style='color: white !important; font-weight: bold;'>Envoyer capture de paiement</span></a>
                
                <a href='https://chat.whatsapp.com/H2HX0arxjCA70EgrcbRWUG' class='btn' style='background-color: #10b981 !important; margin-top: 10px; display: block; color: white !important; font-weight: bold; text-decoration: none !important;'><i class='fas fa-users' style='color: white !important;'></i> <span style='color: white !important; font-weight: bold;'>Rejoindre le groupe Penc'Boost</span></a>
            </div>
            
            <p>Cordialement,<br><strong>L'équipe PENCCUM NDONGO</strong></p>
        </div>
    </div>
</body>
</html>
";

// Envoyer l'email via Gmail SMTP
$emailSent = sendEmailViaSMTP($to, $subject, $htmlMessage, 'PENCCUM NDONGO');
error_log('Email envoyé via SMTP à ' . $to . ': ' . ($emailSent ? 'SUCCÈS' : 'ÉCHEC'));

// Réponse de succès
echo json_encode([
    'success' => true,
    'message' => 'Inscription enregistrée avec succès ! Un email de confirmation vous a été envoyé.',
    'data' => [
        'email' => $data['email'],
        'name' => $data['firstName'] . ' ' . $data['lastName']
    ],
    'email_sent' => $emailSent,
    'debug' => 'Email envoyé: ' . ($emailSent ? 'SUCCÈS' : 'ÉCHEC')
]);
?>