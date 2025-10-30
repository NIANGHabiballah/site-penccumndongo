<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
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

$qr_id = $_GET['id'] ?? null;

if (!$qr_id) {
    echo json_encode(['valid' => false, 'reason' => 'ID manquant']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM qr_certificates WHERE id = ?");
    $stmt->execute([$qr_id]);
    $row = $stmt->fetch();
    
    if (!$row) {
        echo json_encode(['valid' => false, 'reason' => 'Certificat non trouvé']);
        exit;
    }
    
    if (strtotime($row['expires_at']) < time()) {
        echo json_encode(['valid' => false, 'reason' => 'Certificat expiré']);
        exit;
    }
    
    // Incrémenter le compteur de vérifications
    $pdo->prepare("UPDATE qr_certificates SET used_count = used_count + 1 WHERE id = ?")
        ->execute([$qr_id]);
    
    $certificate_data = json_decode($row['certificate_data'], true);
    
    echo json_encode([
        'valid' => true,
        'data' => [
            'participant_name' => $certificate_data['participant_name'],
            'formation_title' => $certificate_data['formation_title'],
            'certificate_id' => $certificate_data['certificate_id'],
            'date_issued' => $certificate_data['date_issued'],
            'verified_count' => $row['used_count'] + 1
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(['valid' => false, 'reason' => 'Erreur de vérification: ' . $e->getMessage()]);
}
?>