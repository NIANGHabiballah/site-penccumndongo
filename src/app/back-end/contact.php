<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Autoriser toutes les origines (pour le développement)
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');

// Récupérer les données JSON envoyées par Angular
$data = json_decode(file_get_contents("php://input"), true);

// Répondre à la requête OPTIONS (préflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Aucune donnée reçue']);
    exit;
}

// Sécurisation basique
$firstname = htmlspecialchars($data['firstname'] ?? '');
$lastname = htmlspecialchars($data['lastname'] ?? '');
$phone = htmlspecialchars($data['phone'] ?? '');
$email = htmlspecialchars($data['email'] ?? '');
$company = htmlspecialchars($data['company'] ?? '');
$message = htmlspecialchars($data['message'] ?? '');

// Connexion à la base de données
$pdo = new PDO('mysql:host=localhost;dbname=form_contact;charset=utf8', 'root', 'tafsir');

// Préparation et insertion
$stmt = $pdo->prepare("INSERT INTO contact_messages (firstname, lastname, phone, email, company, message) VALUES (?, ?, ?, ?, ?, ?)");
$success = $stmt->execute([$firstname, $lastname, $phone, $email, $company, $message]);

if ($success) {
    echo json_encode(['success' => true, 'message' => 'Message enregistré']);
} else {
    echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'enregistrement']);
}