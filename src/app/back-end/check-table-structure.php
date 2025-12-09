<?php
require_once 'config.php';

try {
    $pdo = getDB();
    
    // Vérifier la structure de la table cp2i_evaluations
    $stmt = $pdo->query("DESCRIBE cp2i_evaluations");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Structure de cp2i_evaluations:\n";
    foreach($columns as $col) {
        echo $col['Field'] . " - " . $col['Type'] . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>