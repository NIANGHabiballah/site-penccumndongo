<?php
require_once 'config/database.php';

try {
    // Ajouter les colonnes pour les notes par critère
    $sql = "
    ALTER TABLE corrections 
    ADD COLUMN IF NOT EXISTS note_pertinence DECIMAL(3,1) DEFAULT NULL COMMENT 'Note Pertinence sur 5',
    ADD COLUMN IF NOT EXISTS note_coherence DECIMAL(3,1) DEFAULT NULL COMMENT 'Note Cohérence sur 5', 
    ADD COLUMN IF NOT EXISTS note_correction DECIMAL(3,1) DEFAULT NULL COMMENT 'Note Correction de la langue sur 5',
    ADD COLUMN IF NOT EXISTS note_presentation DECIMAL(3,1) DEFAULT NULL COMMENT 'Note Présentation sur 5'
    ";
    
    $pdo->exec($sql);
    echo "Colonnes ajoutées avec succès.\n";
    
    // Mettre à jour les corrections existantes
    $updateSql = "
    UPDATE corrections 
    SET 
        note_pertinence = ROUND(note / 4, 1),
        note_coherence = ROUND(note / 4, 1), 
        note_correction = ROUND(note / 4, 1),
        note_presentation = ROUND(note / 4, 1)
    WHERE note IS NOT NULL AND note > 0 
    AND (note_pertinence IS NULL OR note_coherence IS NULL OR note_correction IS NULL OR note_presentation IS NULL)
    ";
    
    $stmt = $pdo->prepare($updateSql);
    $stmt->execute();
    
    echo "Corrections existantes mises à jour: " . $stmt->rowCount() . " lignes affectées.\n";
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}
?>