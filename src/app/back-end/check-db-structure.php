<?php
require_once 'config.php';
header('Content-Type: application/json');
setCorsHeaders();

try {
    $pdo = getDB();
    
    // Vérifier la structure de la table chat_messages
    $stmt = $pdo->query("DESCRIBE chat_messages");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'table_structure' => $columns,
        'has_images_column' => in_array('images', array_column($columns, 'Field'))
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'error' => 'Erreur vérification structure: ' . $e->getMessage()
    ]);
}
?>