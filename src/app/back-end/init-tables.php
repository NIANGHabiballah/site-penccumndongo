<?php
require_once 'config.php';

$db = getDB();

// Ajouter les colonnes pour la récupération de mot de passe
$alterUsers = "ALTER TABLE cp2i_users 
    ADD COLUMN IF NOT EXISTS reset_token VARCHAR(64) NULL,
    ADD COLUMN IF NOT EXISTS reset_token_expiry DATETIME NULL";

try {
    $db->exec($alterUsers);
    echo "✓ Colonnes reset ajoutées à cp2i_users\n";
} catch (PDOException $e) {
    echo "✗ Erreur colonnes reset: " . $e->getMessage() . "\n";
}

// Supprimer et recréer la table d'historique
try {
    $db->exec("DROP TABLE IF EXISTS cp2i_history");
    echo "✓ Ancienne table cp2i_history supprimée\n";
} catch (PDOException $e) {
    echo "✗ Erreur suppression: " . $e->getMessage() . "\n";
}

$historyTable = "CREATE TABLE cp2i_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

try {
    $db->exec($historyTable);
    echo "✓ Nouvelle table cp2i_history créée\n";
} catch (PDOException $e) {
    echo "✗ Erreur création: " . $e->getMessage() . "\n";
}

echo "Initialisation terminée.\n";
?>