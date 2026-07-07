<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

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
    echo json_encode(['error' => 'Connexion échouée']);
    exit;
}

$user_id = $_GET['user_id'] ?? 23;

// Vérifier l'utilisateur
$stmt = $pdo->prepare("
    SELECT u.id, u.nom, u.prenom, u.email, u.created_at,
           AVG(CAST(t.note AS DECIMAL(4,2))) as note_moyenne,
           COUNT(t.id) as total_textes
    FROM cp2i_users u 
    LEFT JOIN cp2i_textes t ON u.id = t.user_id 
    WHERE u.id = ? AND u.role = 'participant'
    GROUP BY u.id
");
$stmt->execute([$user_id]);
$participant = $stmt->fetch();

if (!$participant) {
    echo json_encode(['error' => 'Utilisateur non trouvé']);
    exit;
}

// Calculer le hash comme dans generateUniqueCode()
$note_for_hash = $participant['note_moyenne'] ? round($participant['note_moyenne'], 1) : 'null';
$data = $user_id . '-' . $note_for_hash . '-' . date('d M', strtotime($participant['created_at'])) . '-CP2i2025';
$hash = base64_encode($data);
$hash = substr($hash, 0, 16);

$code = "CP2i-{$user_id}-2025-{$hash}";

echo json_encode([
    'user_id' => $user_id,
    'participant' => $participant,
    'data_for_hash' => $data,
    'calculated_hash' => $hash,
    'generated_code' => $code,
    'provided_code' => 'CP2i-26-2025-MjYtbnVsbC0yOSBv'
]);
?>