<?php
header('Content-Type: text/plain');
require_once 'config/database.php';

try {
    // Vérifier la structure de cp2i_corrections
    echo "=== STRUCTURE DE cp2i_corrections ===\n";
    $stmt = $pdo->query("DESCRIBE cp2i_corrections");
    while ($row = $stmt->fetch()) {
        echo $row['Field'] . " - " . $row['Type'] . "\n";
    }
    
    echo "\n=== DONNÉES DANS cp2i_corrections ===\n";
    $stmt = $pdo->query("SELECT * FROM cp2i_corrections LIMIT 5");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
        echo "\n---\n";
    }
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage();
}
?>