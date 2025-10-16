<?php
require_once 'config.php';

$db = getDB();

// Ajouter les colonnes pour la récupération de mot de passe
$alterUsers = "ALTER TABLE cp2i_users 
    ADD COLUMN IF NOT EXISTS reset_token VARCHAR(64) NULL,
    ADD COLUMN IF NOT EXISTS reset_token_expiry DATETIME NULL,
    ADD COLUMN IF NOT EXISTS plain_password VARCHAR(255) NULL";

// Créer la table des textes si elle n'existe pas
try {
    $textesTable = "CREATE TABLE IF NOT EXISTS cp2i_textes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        titre VARCHAR(255) NOT NULL,
        contenu TEXT NOT NULL,
        langue ENUM('francais', 'wolof', 'anglais') DEFAULT 'francais',
        statut ENUM('en_attente', 'accepte', 'refuse') DEFAULT 'en_attente',
        note INT NULL,
        commentaire TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES cp2i_users(id) ON DELETE CASCADE
    )";
    
    $db->exec($textesTable);
    echo "✓ Table cp2i_textes créée\n";
} catch (PDOException $e) {
    echo "✗ Erreur table textes: " . $e->getMessage() . "\n";
}

try {
    $db->exec($alterUsers);
    echo "✓ Colonnes reset et plain_password ajoutées à cp2i_users\n";
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

// Créer la table des affectations si elle n'existe pas
try {
    $affectationsTable = "CREATE TABLE IF NOT EXISTS cp2i_affectations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        participant_id INT NOT NULL,
        corrector_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_participant (participant_id),
        FOREIGN KEY (participant_id) REFERENCES cp2i_users(id) ON DELETE CASCADE,
        FOREIGN KEY (corrector_id) REFERENCES cp2i_users(id) ON DELETE CASCADE
    )";
    
    $db->exec($affectationsTable);
    echo "✓ Table cp2i_affectations créée\n";
} catch (PDOException $e) {
    echo "✗ Erreur table affectations: " . $e->getMessage() . "\n";
}

echo "Initialisation terminée.\n";
?>