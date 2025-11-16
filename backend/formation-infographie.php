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
    
    if (!$input) {
        throw new Exception('Aucune donnée reçue ou données JSON invalides');
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO formation_inscriptions 
        (firstName, lastName, email, phone, format, profession, motivation, acceptTerms, submittedAt, formationType) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $result = $stmt->execute([
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
    
    // Vérifier si l'insertion a réellement fonctionné
    $insertedId = $pdo->lastInsertId();
    if (!$insertedId) {
        throw new Exception('Aucune donnée insérée en base de données');
    }
    
    // Envoyer l'email de confirmation
    $emailData = [
        'email' => $input['email'],
        'firstName' => $input['firstName'],
        'lastName' => $input['lastName'],
        'phone' => $input['phone'] ?? ''
    ];
    
    $emailResponse = file_get_contents('http://localhost/backend/send-confirmation-email.php', false, stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode($emailData)
        ]
    ]));
    
    echo json_encode([
        'success' => true, 
        'message' => 'Inscription enregistrée',
        'data' => [
            'id' => $insertedId,
            'email' => $input['email'],
            'name' => $input['firstName'] . ' ' . $input['lastName']
        ],
        'email_sent' => $emailResponse ? true : false
    ]);
    
} catch(Exception $e) {
    // Log l'erreur pour debug
    error_log('Erreur formation-infographie: ' . $e->getMessage());
    error_log('Données reçues: ' . print_r($input, true));
    
    echo json_encode([
        'success' => false, 
        'message' => 'Erreur: ' . $e->getMessage(),
        'debug' => [
            'error' => $e->getMessage(),
            'line' => $e->getLine(),
            'file' => $e->getFile()
        ]
    ]);
}
?>