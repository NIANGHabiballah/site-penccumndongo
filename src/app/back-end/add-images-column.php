<?php
require_once 'config.php';
header('Content-Type: application/json');
setCorsHeaders();

try {
    $pdo = getDB();
    
    // Vérifier si la colonne images existe
    $stmt = $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'images'");
    $columnExists = $stmt->fetch();
    
    if (!$columnExists) {
        // Ajouter la colonne images
        $pdo->exec("ALTER TABLE chat_messages ADD COLUMN images TEXT NULL AFTER message");
        echo json_encode([
            'success' => true,
            'message' => 'Colonne images ajoutée avec succès'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'Colonne images existe déjà'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'error' => 'Erreur ajout colonne: ' . $e->getMessage()
    ]);
}
?>