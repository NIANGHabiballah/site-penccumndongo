<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config/database.php';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("
        INSERT INTO formation_inscriptions 
        (firstName, lastName, email, phone, format, profession, motivation, acceptTerms, submittedAt, formationType) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $input['firstName'],
        $input['lastName'], 
        $input['email'],
        $input['phone'],
        $input['format'],
        $input['profession'],
        $input['motivation'],
        $input['acceptTerms'] ? 1 : 0,
        $input['submittedAt'],
        $input['formationType']
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Inscription enregistrée']);
    
} catch(Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>