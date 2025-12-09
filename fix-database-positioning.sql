-- CORRECTION DES PROBLÈMES DE POSITIONNEMENT DE LA BASE DE DONNÉES CP2i
-- Exécuter ce script pour corriger les incohérences identifiées

-- 1. STANDARDISATION DES NOMS DE TABLES ET COLONNES
-- Problème : Incohérence entre cp2i_users/users et cp2i_textes/textes

-- Renommer les colonnes pour cohérence
ALTER TABLE cp2i_textes CHANGE COLUMN user_id participant_id INT NOT NULL;

-- 2. CORRECTION DES CLÉS ÉTRANGÈRES MANQUANTES
-- Ajouter les contraintes manquantes si elles n'existent pas

-- Vérifier et ajouter la contrainte pour cp2i_textes
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'cp2i_textes' 
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME LIKE '%participant%'
);

SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE cp2i_textes ADD CONSTRAINT fk_textes_participant FOREIGN KEY (participant_id) REFERENCES cp2i_users(id) ON DELETE CASCADE',
    'SELECT "Contrainte participant_id existe déjà" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. CORRECTION DES DONNÉES ORPHELINES
-- Supprimer les textes sans utilisateur valide
DELETE FROM cp2i_textes 
WHERE participant_id NOT IN (SELECT id FROM cp2i_users);

-- Supprimer les corrections sans texte valide
DELETE FROM cp2i_corrections 
WHERE texte_id NOT IN (SELECT id FROM cp2i_textes);

-- Supprimer les évaluations sans texte valide
DELETE FROM cp2i_evaluations 
WHERE texte_id NOT IN (SELECT id FROM cp2i_textes);

-- 4. STANDARDISATION DES STATUTS
-- Corriger les statuts incohérents
UPDATE cp2i_textes 
SET statut = 'en_attente' 
WHERE statut IS NULL OR statut = '' OR statut NOT IN ('en_attente', 'accepte', 'refuse');

-- 5. CORRECTION DES NOTES INVALIDES
-- Nettoyer les notes hors limites (0-20)
UPDATE cp2i_textes 
SET note = NULL 
WHERE note < 0 OR note > 20;

UPDATE cp2i_corrections 
SET note = GREATEST(0, LEAST(20, note));

UPDATE cp2i_evaluations 
SET note_totale = GREATEST(0, LEAST(20, note_totale)),
    note_pertinence = GREATEST(0, LEAST(5, note_pertinence)),
    note_coherence = GREATEST(0, LEAST(5, note_coherence)),
    note_correction = GREATEST(0, LEAST(5, note_correction)),
    note_presentation = GREATEST(0, LEAST(5, note_presentation));

-- 6. AJOUT DE LA COLONNE IMAGES MANQUANTE
-- Pour le système de chat
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS images TEXT NULL 
AFTER message;

-- 7. CRÉATION D'INDEX MANQUANTS POUR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_textes_statut_note ON cp2i_textes(statut, note);
CREATE INDEX IF NOT EXISTS idx_evaluations_texte_correcteur ON cp2i_evaluations(texte_id, correcteur_id);
CREATE INDEX IF NOT EXISTS idx_corrections_note ON cp2i_corrections(note);

-- 8. MISE À JOUR DES TIMESTAMPS
-- S'assurer que tous les enregistrements ont des timestamps valides
UPDATE cp2i_textes 
SET created_at = COALESCE(created_at, NOW()), 
    updated_at = COALESCE(updated_at, NOW()) 
WHERE created_at IS NULL OR updated_at IS NULL;

-- 9. CORRECTION DES AFFECTATIONS DUPLIQUÉES
-- Supprimer les doublons dans cp2i_affectations
DELETE a1 FROM cp2i_affectations a1
INNER JOIN cp2i_affectations a2 
WHERE a1.id > a2.id 
AND a1.texte_id = a2.texte_id 
AND a1.corrector_id = a2.corrector_id;

-- 10. VÉRIFICATION FINALE DES DONNÉES
-- Créer une vue pour vérifier l'intégrité
CREATE OR REPLACE VIEW v_data_integrity AS
SELECT 
    'cp2i_textes' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN participant_id NOT IN (SELECT id FROM cp2i_users) THEN 1 END) as orphaned_records,
    COUNT(CASE WHEN statut NOT IN ('en_attente', 'accepte', 'refuse') THEN 1 END) as invalid_status,
    COUNT(CASE WHEN note < 0 OR note > 20 THEN 1 END) as invalid_notes
FROM cp2i_textes

UNION ALL

SELECT 
    'cp2i_corrections' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN texte_id NOT IN (SELECT id FROM cp2i_textes) THEN 1 END) as orphaned_records,
    0 as invalid_status,
    COUNT(CASE WHEN note < 0 OR note > 20 THEN 1 END) as invalid_notes
FROM cp2i_corrections

UNION ALL

SELECT 
    'cp2i_evaluations' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN texte_id NOT IN (SELECT id FROM cp2i_textes) THEN 1 END) as orphaned_records,
    0 as invalid_status,
    COUNT(CASE WHEN note_totale < 0 OR note_totale > 20 THEN 1 END) as invalid_notes
FROM cp2i_evaluations;

-- Afficher le rapport d'intégrité
SELECT * FROM v_data_integrity;

-- 11. MISE À JOUR DES STATISTIQUES
-- Recalculer les notes finales des textes
UPDATE cp2i_textes t
SET note = (
    SELECT AVG(e.note_totale)
    FROM cp2i_evaluations e
    WHERE e.texte_id = t.id
    AND e.note_totale IS NOT NULL
)
WHERE EXISTS (
    SELECT 1 FROM cp2i_evaluations e 
    WHERE e.texte_id = t.id 
    AND e.note_totale IS NOT NULL
);

-- Mettre à jour le statut basé sur les notes
UPDATE cp2i_textes 
SET statut = CASE 
    WHEN note >= 10 THEN 'accepte'
    WHEN note < 10 AND note IS NOT NULL THEN 'refuse'
    ELSE 'en_attente'
END
WHERE note IS NOT NULL;

-- Message de confirmation
SELECT 'Base de données corrigée avec succès!' as message;