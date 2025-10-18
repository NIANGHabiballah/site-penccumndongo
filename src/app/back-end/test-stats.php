<?php
require_once 'config.php';
setCorsHeaders();

try {
    $db = getDB();
    
    // Test simple des stats
    $stmt = $db->prepare("SELECT COUNT(*) as total_textes FROM cp2i_textes");
    $stmt->execute();
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'stats' => $stats
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'line' => $e->getLine()
    ]);
}
?>