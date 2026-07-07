<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: https://penccumndongo.com");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Aucune donnée reçue']);
    exit;
}

$nom = htmlspecialchars($data['nom'] ?? '');
$email = htmlspecialchars($data['email'] ?? '');
$telephone = htmlspecialchars($data['telephone'] ?? '');
$entreprise = htmlspecialchars($data['entreprise'] ?? '');
$vousetes = htmlspecialchars($data['vousetes'] ?? '');
$service = htmlspecialchars($data['service'] ?? '');
$details = htmlspecialchars($data['details'] ?? '');
$budget = htmlspecialchars($data['budget'] ?? '');
$connaissance = htmlspecialchars($data['connaissance'] ?? '');
$canal = htmlspecialchars($data['canal'] ?? '');

// Vérification des champs obligatoires
if (!$nom || !$email || !$telephone || !$vousetes || !$service || !$details || !$connaissance || !$canal) {
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
    $stmt = $pdo->prepare("INSERT INTO devis (nom, email, telephone, entreprise, vousetes, service, details, budget, connaissance, canal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $success = $stmt->execute([$nom, $email, $telephone, $entreprise, $vousetes, $service, $details, $budget, $connaissance, $canal]);
    if ($success) {
        echo json_encode(['success' => true, 'message' => 'Votre demande de devis a bien été enregistrée !']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'enregistrement']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur serveur : ' . $e->getMessage()]);
}