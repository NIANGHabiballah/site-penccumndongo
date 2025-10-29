<?php
$host = 'localhost';
$dbname = 'u122559880_form_contact';
$username = 'u122559880_form_contact';
$password = 'VotreMotDePasse'; // À remplacer par votre vrai mot de passe

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur de connexion à la base de données']);
    exit;
}
?>