<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once 'config/database.php';

try {
    $stmt = $pdo->query("
        SELECT id, titre as subject, contenu as content, created_at, lu_at as read_at 
        FROM cp2i_textes_complets 
        WHERE send_to_all = 1
        ORDER BY created_at DESC
    ");
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'messages' => $messages
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>