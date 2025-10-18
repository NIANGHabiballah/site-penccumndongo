<?php
require_once 'config.php';

try {
    $db = getDB();
    
    // Créer la table des affectations si elle n'existe pas
    $sql = "CREATE TABLE IF NOT EXISTS cp2i_affectations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        texte_id INT NOT NULL,
        corrector_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (texte_id) REFERENCES cp2i_textes(id) ON DELETE CASCADE,
        FOREIGN KEY (corrector_id) REFERENCES cp2i_users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_affectation (texte_id, corrector_id)
    )";
    
    $db->exec($sql);
    echo "Table cp2i_affectations créée avec succès\n";
    
    // Créer la table des messages si elle n'existe pas
    $sql = "CREATE TABLE IF NOT EXISTS cp2i_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        recipient_id INT NULL,
        subject VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        send_to_all BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES cp2i_users(id) ON DELETE CASCADE,
        FOREIGN KEY (recipient_id) REFERENCES cp2i_users(id) ON DELETE CASCADE
    )";
    
    $db->exec($sql);
    echo "Table cp2i_messages créée avec succès\n";
    
    // Ajouter des colonnes d'évaluation détaillée à la table textes si elles n'existent pas
    $columns = [
        'eval_originalite' => 'INT DEFAULT 0',
        'eval_style' => 'INT DEFAULT 0', 
        'eval_theme' => 'INT DEFAULT 0',
        'eval_technique' => 'INT DEFAULT 0'
    ];
    
    foreach ($columns as $column => $definition) {
        try {
            $sql = "ALTER TABLE cp2i_textes ADD COLUMN $column $definition";
            $db->exec($sql);
            echo "Colonne $column ajoutée avec succès\n";
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'Duplicate column name') === false) {
                echo "Erreur lors de l'ajout de la colonne $column: " . $e->getMessage() . "\n";
            }
        }
    }
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}
?>