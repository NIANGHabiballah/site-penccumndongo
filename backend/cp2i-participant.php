<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once 'config/database.php';

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'history':
            $stmt = $pdo->query("
                SELECT 
                    'Soumission de texte' as action,
                    CONCAT('Texte \"', titre, '\" soumis') as description,
                    created_at
                FROM cp2i_textes 
                ORDER BY created_at DESC 
                LIMIT 10
            ");
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'history' => $history
            ]);
            break;
            
        default:
            echo json_encode(['error' => 'Action non reconnue']);
    }
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>