<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';
setCorsHeaders();

$user = verifyToken();
if (!$user || $user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

try {
    $db = getDB();
    
    // Statistiques générales
    $stmt = $db->prepare("
        SELECT 
            COUNT(*) as total_textes,
            SUM(CASE WHEN statut = 'accepte' THEN 1 ELSE 0 END) as textes_acceptes,
            SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END) as textes_refuses,
            SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as textes_en_attente,
            AVG(CASE WHEN note IS NOT NULL AND note > 0 THEN note ELSE NULL END) as note_moyenne
        FROM cp2i_textes
    ");
    $stmt->execute();
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'stats' => $stats
    ]);
    
} catch (Exception $e) {
    error_log('Erreur admin stats: ' . $e->getMessage());
    echo json_encode([
        'success' => true,
        'stats' => [
            'total_textes' => 0,
            'textes_acceptes' => 0,
            'textes_refuses' => 0,
            'textes_en_attente' => 0,
            'note_moyenne' => null
        ]
    ]);
}
?>