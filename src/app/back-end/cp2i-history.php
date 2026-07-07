<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $db = getDB();
        
        $stmt = $db->prepare("
            SELECT h.id, h.action, h.description, h.created_at, 
                   u.prenom, u.nom, u.email
            FROM cp2i_history h 
            LEFT JOIN cp2i_users u ON h.user_id = u.id 
            ORDER BY h.created_at DESC 
            LIMIT 20
        ");
        $stmt->execute();
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'history' => $history
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => true,
            'history' => []
        ]);
    }
}
?>