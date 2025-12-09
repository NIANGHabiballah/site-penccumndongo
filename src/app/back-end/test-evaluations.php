<?php
require_once 'config.php';

try {
    // Test simple query
    $stmt = $pdo->query("SELECT COUNT(*) FROM cp2i_evaluations");
    $count = $stmt->fetchColumn();
    echo "cp2i_evaluations count: " . $count . "\n";
    
    // Test structure
    $stmt = $pdo->query("DESCRIBE cp2i_evaluations");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Columns:\n";
    foreach($columns as $col) {
        echo $col['Field'] . " - " . $col['Type'] . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>