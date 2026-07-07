<?php
require_once 'config.php';

$db = getDB();

try {
    // Vérifier la structure actuelle
    $stmt = $db->query("DESCRIBE cp2i_affectations");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $hasTexteId = false;
    $hasParticipantId = false;
    
    foreach ($columns as $col) {
        if ($col['Field'] === 'texte_id') $hasTexteId = true;
        if ($col['Field'] === 'participant_id') $hasParticipantId = true;
    }
    
    echo "Structure actuelle:\n";
    foreach ($columns as $col) {
        echo "- {$col['Field']} ({$col['Type']})\n";
    }
    
    // Si on a participant_id mais pas texte_id, on doit migrer
    if ($hasParticipantId && !$hasTexteId) {
        echo "\nMigration nécessaire: participant_id -> texte_id\n";
        
        // Sauvegarder les données existantes
        $stmt = $db->query("SELECT * FROM cp2i_affectations");
        $oldAffectations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Supprimer la table et la recréer
        $db->exec("DROP TABLE IF EXISTS cp2i_affectations");
        
        $db->exec("
            CREATE TABLE cp2i_affectations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                texte_id INT NOT NULL,
                corrector_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (texte_id) REFERENCES cp2i_textes(id) ON DELETE CASCADE,
                FOREIGN KEY (corrector_id) REFERENCES cp2i_users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_texte_corrector (texte_id, corrector_id)
            )
        ");
        
        echo "Table recréée avec texte_id\n";
        
        // Migrer les données: pour chaque participant, affecter le correcteur à tous ses textes
        foreach ($oldAffectations as $aff) {
            $stmt = $db->prepare("SELECT id FROM cp2i_textes WHERE user_id = ?");
            $stmt->execute([$aff['participant_id']]);
            $textes = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            foreach ($textes as $texte_id) {
                try {
                    $stmt = $db->prepare("INSERT IGNORE INTO cp2i_affectations (texte_id, corrector_id) VALUES (?, ?)");
                    $stmt->execute([$texte_id, $aff['corrector_id']]);
                    echo "Migré: texte $texte_id -> correcteur {$aff['corrector_id']}\n";
                } catch (Exception $e) {
                    echo "Erreur migration: " . $e->getMessage() . "\n";
                }
            }
        }
        
    } elseif (!$hasTexteId && !$hasParticipantId) {
        echo "\nCréation de la table cp2i_affectations\n";
        
        $db->exec("
            CREATE TABLE cp2i_affectations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                texte_id INT NOT NULL,
                corrector_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (texte_id) REFERENCES cp2i_textes(id) ON DELETE CASCADE,
                FOREIGN KEY (corrector_id) REFERENCES cp2i_users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_texte_corrector (texte_id, corrector_id)
            )
        ");
        
        echo "Table créée avec succès\n";
        
    } else {
        echo "\nTable déjà correcte avec texte_id\n";
    }
    
    // Vérifier le résultat final
    echo "\nStructure finale:\n";
    $stmt = $db->query("DESCRIBE cp2i_affectations");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "- {$col['Field']} ({$col['Type']})\n";
    }
    
    echo "\nMigration terminée avec succès!\n";
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}
?>