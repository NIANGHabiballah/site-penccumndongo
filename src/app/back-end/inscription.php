<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: http://localhost:4200");
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

// Champs obligatoires
$nom = htmlspecialchars($data['nom'] ?? '');
$prenom = htmlspecialchars($data['prenom'] ?? '');
$dateNaissance = htmlspecialchars($data['dateNaissance'] ?? '');
$email = htmlspecialchars($data['email'] ?? '');
$telephone = htmlspecialchars($data['telephone'] ?? '');
$adresse = htmlspecialchars($data['adresse'] ?? '');
$ville = htmlspecialchars($data['ville'] ?? '');
$niveauEtudes = htmlspecialchars($data['niveauEtudes'] ?? '');
$axes = isset($data['axes']) ? json_encode($data['axes']) : '';
$motivation = htmlspecialchars($data['motivation'] ?? '');

if (!$nom || !$prenom || !$dateNaissance || !$email || !$telephone || !$adresse || !$ville || !$niveauEtudes || !$axes) {
    echo json_encode(['success' => false, 'message' => 'Merci de remplir tous les champs obligatoires.']);
    exit;
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=form_contact;charset=utf8', 'root', 'tafsir');
    $stmt = $pdo->prepare("INSERT INTO inscriptions (nom, prenom, date_naissance, email, telephone, adresse, ville, niveau_etudes, axes, motivation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $success = $stmt->execute([$nom, $prenom, $dateNaissance, $email, $telephone, $adresse, $ville, $niveauEtudes, $axes, $motivation]);
    if ($success) {
        echo json_encode(['success' => true, 'message' => 'Inscription enregistrée avec succès.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'enregistrement.']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur serveur : ' . $e->getMessage()]);
}