<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: https://penccumndongo.com');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Aucune donnée reçue']);
    exit;
}

$firstName = htmlspecialchars($data['firstName'] ?? '');
$lastName = htmlspecialchars($data['lastName'] ?? '');
$email = htmlspecialchars($data['email'] ?? '');
$phone = htmlspecialchars($data['phone'] ?? '');
$format = htmlspecialchars($data['format'] ?? '');
$profession = htmlspecialchars($data['profession'] ?? '');
$motivation = htmlspecialchars($data['motivation'] ?? '');
$paymentMethod = htmlspecialchars($data['paymentMethod'] ?? '');
$acceptTerms = !empty($data['acceptTerms']) ? 1 : 0;
$submittedAt = date('Y-m-d H:i:s');
$formationType = 'infographie';

if (!$firstName || !$lastName || !$email || !$phone || !$format || !$profession || !$motivation || !$paymentMethod) {
    echo json_encode(['success' => false, 'message' => 'Merci de remplir tous les champs obligatoires.']);
    exit;
}

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=u122559880_form_contact;charset=utf8',
        'u122559880_root',
        'Tafsir#27',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $stmt = $pdo->prepare('INSERT INTO formation_infographie_inscriptions (first_name, last_name, email, phone, format, profession, motivation, payment_method, accept_terms, submitted_at, formation_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $success = $stmt->execute([$firstName, $lastName, $email, $phone, $format, $profession, $motivation, $paymentMethod, $acceptTerms, $submittedAt, $formationType]);
    if ($success) {
        echo json_encode(['success' => true, 'message' => 'Votre inscription a bien été enregistrée !']);
    } else {
        echo json_encode(['success' => false, 'message' => "Erreur lors de l'enregistrement"]);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur serveur : ' . $e->getMessage()]);
}