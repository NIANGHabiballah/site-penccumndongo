<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL);

if (!$email) {
    echo json_encode(['success' => false, 'message' => 'Email invalide']);
    exit;
}

// Configuration base de données
$host = 'localhost';
$dbname = 'u122559880_form_contact';
$username = 'u122559880_root';
$password = 'Tafsir#27';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Vérifier si l'email existe déjà
    $stmt = $pdo->prepare("SELECT id FROM newsletter_subscribers WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Cet email est déjà inscrit']);
        exit;
    }
    
    // Insérer le nouvel abonné
    $stmt = $pdo->prepare("INSERT INTO newsletter_subscribers (email, subscribed_at, status) VALUES (?, NOW(), 'active')");
    $stmt->execute([$email]);
    
    // Email de confirmation
    $subject = 'Bienvenue dans la newsletter PENCCUM NDONGO !';
    $message = "
    <html>
    <body>
        <h2>Merci pour votre inscription !</h2>
        <p>Vous recevrez désormais nos actualités, conseils et offres exclusives.</p>
        <p>L'équipe PENCCUM NDONGO</p>
    </body>
    </html>
    ";
    
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: PENCCUM NDONGO <pencc.penccumndongo@gmail.com>',
        'Reply-To: pencc.penccumndongo@gmail.com'
    ];
    
    mail($email, $subject, $message, implode("\r\n", $headers));
    
    echo json_encode(['success' => true, 'message' => 'Inscription réussie !']);
    
} catch (PDOException $e) {
    error_log("Newsletter DB Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}
?>