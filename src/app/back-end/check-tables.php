<?php
require_once 'config.php';

$db = getDB();

echo "=== Vérification des tables ===\n\n";

// Vérifier si la table cp2i_affectations existe
try {
    $stmt = $db->query("SHOW TABLES LIKE 'cp2i_affectations'");
    $exists = $stmt->fetch();
    
    if ($exists) {
        echo "✓ Table cp2i_affectations existe\n";
        
        // Vérifier le contenu
        $stmt = $db->query("SELECT COUNT(*) as count FROM cp2i_affectations");
        $count = $stmt->fetch()['count'];
        echo "  Nombre d'affectations: $count\n";
        
        if ($count > 0) {
            $stmt = $db->query("SELECT * FROM cp2i_affectations LIMIT 3");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo "  Exemples:\n";
            foreach ($rows as $row) {
                echo "    texte_id: {$row['texte_id']}, corrector_id: {$row['corrector_id']}\n";
            }
        }
    } else {
        echo "✗ Table cp2i_affectations n'existe pas\n";
        echo "Création de la table...\n";
        
        $sql = "CREATE TABLE cp2i_affectations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            texte_id INT NOT NULL,
            corrector_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (texte_id) REFERENCES cp2i_textes(id) ON DELETE CASCADE,
            FOREIGN KEY (corrector_id) REFERENCES cp2i_users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_assignment (texte_id, corrector_id)
        )";
        
        $db->exec($sql);
        echo "✓ Table cp2i_affectations créée\n";
    }
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}

// Vérifier les autres tables
$stmt = $db->query("SELECT COUNT(*) as count FROM cp2i_textes");
$textes_count = $stmt->fetch()['count'];
echo "\nNombre de textes: $textes_count\n";

$stmt = $db->query("SELECT COUNT(*) as count FROM cp2i_users WHERE role = 'correcteur'");
$correcteurs_count = $stmt->fetch()['count'];
echo "Nombre de correcteurs: $correcteurs_count\n";
?>