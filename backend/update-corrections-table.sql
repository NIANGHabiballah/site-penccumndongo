-- Ajouter les colonnes pour stocker les notes par critère dans la table corrections
ALTER TABLE corrections 
ADD COLUMN note_pertinence DECIMAL(3,1) DEFAULT NULL COMMENT 'Note Pertinence sur 5',
ADD COLUMN note_coherence DECIMAL(3,1) DEFAULT NULL COMMENT 'Note Cohérence sur 5', 
ADD COLUMN note_correction DECIMAL(3,1) DEFAULT NULL COMMENT 'Note Correction de la langue sur 5',
ADD COLUMN note_presentation DECIMAL(3,1) DEFAULT NULL COMMENT 'Note Présentation sur 5';

-- Mettre à jour les corrections existantes avec des notes calculées basées sur la note totale
UPDATE corrections 
SET 
    note_pertinence = ROUND(note / 4, 1),
    note_coherence = ROUND(note / 4, 1), 
    note_correction = ROUND(note / 4, 1),
    note_presentation = ROUND(note / 4, 1)
WHERE note IS NOT NULL AND note > 0;