<?php
require_once 'config.php';
setCorsHeaders();

// Activer les erreurs pour voir les problèmes
ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    $db = getDB();
    
    // Supprimer TOUTES les affectations
    $stmt = $db->prepare("DELETE FROM cp2i_affectations");
    $result = $stmt->execute();
    $count = $stmt->rowCount();
    
    echo json_encode([
        'success' => true,
        'message' => "TOUTES les affectations ont été supprimées",
        'count' => $count,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>