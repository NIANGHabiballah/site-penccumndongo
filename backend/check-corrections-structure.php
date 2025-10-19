<?php
require_once 'config/database.php';

try {
    // Vérifier la structure de la table corrections
    $stmt = $pdo->query("DESCRIBE corrections");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Structure actuelle de la table corrections:\n";
    foreach ($columns as $column) {
        echo "- " . $column['Field'] . " (" . $column['Type'] . ")\n";
    }
    
    // Vérifier s'il y a des données
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM corrections");
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "\nNombre de corrections: " . $count['count'] . "\n";
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage();
}
?>