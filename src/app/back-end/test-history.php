<?php
require_once 'config.php';

$db = getDB();

// Test simple de la table
try {
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM cp2i_history");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "✓ Table cp2i_history accessible, " . $result['count'] . " entrées\n";
    
    // Test de jointure
    $stmt = $db->prepare("
        SELECT h.*, u.prenom, u.nom 
        FROM cp2i_history h 
        LEFT JOIN cp2i_users u ON h.user_id = u.id 
        LIMIT 5
    ");
    $stmt->execute();
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "✓ Jointure OK, " . count($history) . " résultats\n";
    
} catch (PDOException $e) {
    echo "✗ Erreur: " . $e->getMessage() . "\n";
}
?>