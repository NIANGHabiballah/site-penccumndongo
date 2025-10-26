<?php
// Debug simple pour CP2i
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Test connexion BDD
    $pdo = new PDO(
        'mysql:host=localhost;dbname=u122559880_form_contact;charset=utf8',
        'u122559880_root',
        'Tafsir#27',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    // Test simple de connexion
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $_GET['action'] ?? '';
        
        if ($action === 'login') {
            $email = $input['email'] ?? '';
            $password = $input['password'] ?? '';
            
            if ($email === 'admin@cp2i.com' && $password === 'password123') {
                echo json_encode([
                    'success' => true,
                    'token' => 'test_token_123',
                    'user' => [
                        'id' => 1,
                        'email' => 'admin@cp2i.com',
                        'nom' => 'Admin',
                        'prenom' => 'CP2i',
                        'role' => 'admin'
                    ]
                ]);
            } else {
                http_response_code(401);
                echo json_encode(['error' => 'Identifiants incorrects']);
            }
        } else {
            echo json_encode(['error' => 'Action non supportée']);
        }
    } else {
        echo json_encode(['status' => 'API CP2i Debug OK', 'db' => 'Connected']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur: ' . $e->getMessage()]);
}
?>