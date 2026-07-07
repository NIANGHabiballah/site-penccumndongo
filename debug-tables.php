<?php
require_once 'src/app/back-end/config.php';

try {
    $db = getDB();
    
    echo "=== STRUCTURE DES TABLES ===\n\n";
    
    // Structure cp2i_affectations
    echo "Table cp2i_affectations:\n";
    $stmt = $db->query("DESCRIBE cp2i_affectations");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "- {$row['Field']}: {$row['Type']}\n";
    }
    
    echo "\nTable cp2i_corrections:\n";
    $stmt = $db->query("DESCRIBE cp2i_corrections");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "- {$row['Field']}: {$row['Type']}\n";
    }
    
    echo "\nTable cp2i_evaluations:\n";
    $stmt = $db->query("DESCRIBE cp2i_evaluations");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "- {$row['Field']}: {$row['Type']}\n";
    }
    
    echo "\n=== DONNÉES ÉCHANTILLON ===\n\n";
    
    // Échantillon d'affectations
    echo "Affectations (5 premières):\n";
    $stmt = $db->query("SELECT * FROM cp2i_affectations LIMIT 5");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }
    
    // Échantillon de corrections
    echo "\nCorrections (5 premières):\n";
    $stmt = $db->query("SELECT * FROM cp2i_corrections LIMIT 5");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
    }
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage();
}
?>