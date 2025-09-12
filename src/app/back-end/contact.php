<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Autoriser uniquement ton domaine
header("Access-Control-Allow-Origin: https://penccumndongo.com");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');

// Répondre à la requête OPTIONS (préflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Récupérer les données JSON envoyées par Angular
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Aucune donnée reçue']);
    exit;
}

// Vérification reCAPTCHA
$captchaResponse = $data['g-recaptcha-response'] ?? '';
$secretKey = "6LfFersrAAAAAD7kio_QXNM7cN1ymUBJKt8aOy7J";

if (!$captchaResponse) {
    echo json_encode(['success' => false, 'message' => 'Captcha manquant']);
    exit;
}

// Envoyer la requête à Google
$verifyURL = "https://www.google.com/recaptcha/api/siteverify";
$response = file_get_contents($verifyURL . "?secret=" . $secretKey . "&response=" . $captchaResponse);
$responseKeys = json_decode($response, true);

// Vérifier la réponse
if (!$responseKeys["success"]) {
    echo json_encode(['success' => false, 'message' => 'Captcha invalide']);
    exit;
}

// Sécurisation des champs
$firstname = htmlspecialchars($data['firstname'] ?? '');
$lastname = htmlspecialchars($data['lastname'] ?? '');
$phone = htmlspecialchars($data['phone'] ?? '');
$email = htmlspecialchars($data['email'] ?? '');
$company = htmlspecialchars($data['company'] ?? '');
$message = htmlspecialchars($data['message'] ?? '');

try {
    // Connexion à la base
    $pdo = new PDO(
        'mysql:host=localhost;dbname=u122559880_form_contact;charset=utf8',
        'u122559880_root',
        'Tafsir#27',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Insertion
    $stmt = $pdo->prepare("INSERT INTO contact_messages (firstname, lastname, phone, email, company, message) VALUES (?, ?, ?, ?, ?, ?)");
    $success = $stmt->execute([$firstname, $lastname, $phone, $email, $company, $message]);

    if ($success) {
        echo json_encode(['success' => true, 'message' => 'Votre message a bien été envoyé !']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'enregistrement']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur serveur : ' . $e->getMessage()]);
}