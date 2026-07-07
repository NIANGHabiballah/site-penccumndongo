<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Configuration base de données
define('DB_HOST', 'localhost');
define('DB_NAME', 'u122559880_form_contact');
define('DB_USER', 'u122559880_root');
define('DB_PASS', 'Tafsir#27');

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur de connexion à la base de données: ' . $e->getMessage()]);
    exit;
}

function generateUUID() {
    return bin2hex(random_bytes(16));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $participant_name = $input['participant_name'] ?? '';
    $formation_title = $input['formation_title'] ?? '';
    $certificate_id = $input['certificate_id'] ?? '';
    
    if (empty($participant_name) || empty($formation_title)) {
        echo json_encode(['error' => 'Données manquantes']);
        exit;
    }
    
    $qr_id = generateUUID();
    $date_issued = date('Y-m-d H:i:s');
    $expires_at = date('Y-m-d H:i:s', strtotime('+1 year'));
    
    $data = [
        'participant_name' => $participant_name,
        'formation_title' => $formation_title,
        'certificate_id' => $certificate_id,
        'date_issued' => $date_issued
    ];
    
    try {
        $stmt = $pdo->prepare("INSERT INTO qr_certificates (id, certificate_data, expires_at, used_count) VALUES (?, ?, ?, 0)");
        $stmt->execute([$qr_id, json_encode($data), $expires_at]);
        
        $url = "https://penccumndongo.com/verify?id=" . $qr_id;
        
        echo json_encode([
            'id' => $qr_id,
            'url' => $url,
            'participant_name' => $participant_name,
            'formation_title' => $formation_title,
            'date_issued' => $date_issued
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['error' => 'Erreur de génération: ' . $e->getMessage()]);
    }
}
?>