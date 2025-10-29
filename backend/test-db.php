<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo "=== DIAGNOSTIC BASE DE DONNÉES ===\n\n";

// Test 1: Fichier de config
if (file_exists('config/database.php')) {
    echo "✓ Fichier config/database.php existe\n";
    require_once 'config/database.php';
} else {
    echo "✗ Fichier config/database.php manquant\n";
    exit;
}

// Test 2: Connexion PDO
try {
    if (isset($pdo)) {
        echo "✓ Variable \$pdo définie\n";
        
        // Test 3: Connexion active
        $pdo->query("SELECT 1");
        echo "✓ Connexion à la base de données OK\n";
        
        // Test 4: Table cp2i_messages
        $stmt = $pdo->query("SHOW TABLES LIKE 'cp2i_messages'");
        if ($stmt->rowCount() > 0) {
            echo "✓ Table cp2i_messages existe\n";
            
            // Test 5: Structure de la table
            $stmt = $pdo->query("DESCRIBE cp2i_messages");
            $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
            echo "✓ Colonnes: " . implode(', ', $columns) . "\n";
            
            // Test 6: Données de test
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM cp2i_messages");
            $count = $stmt->fetch(PDO::FETCH_ASSOC);
            echo "✓ Nombre de messages: " . $count['count'] . "\n";
            
        } else {
            echo "✗ Table cp2i_messages n'existe pas\n";
        }
        
    } else {
        echo "✗ Variable \$pdo non définie\n";
    }
} catch (Exception $e) {
    echo "✗ Erreur: " . $e->getMessage() . "\n";
}

echo "\n=== FIN DIAGNOSTIC ===";
?>