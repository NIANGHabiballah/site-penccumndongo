-- Migration : Système multi-éditions CP2i
-- À exécuter une seule fois sur la base de données

USE u122559880_form_contact;

-- 1. Table des éditions
CREATE TABLE IF NOT EXISTS cp2i_editions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero INT NOT NULL,
    annee INT NOT NULL,
    label VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    date_debut DATE NULL,
    date_fin DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_numero (numero)
);

-- 2. Insérer les deux éditions
INSERT IGNORE INTO cp2i_editions (numero, annee, label, is_active, date_debut, date_fin) VALUES
(3, 2025, '3ᵉ édition (2025)', FALSE, '2025-11-03', '2025-12-10'),
(4, 2026, '4ᵉ édition (2026)', TRUE,  '2026-11-03', '2026-12-10');

-- 3. Ajouter edition_id dans cp2i_textes (stocke le NUMERO, pas l'id)
ALTER TABLE cp2i_textes
    ADD COLUMN IF NOT EXISTS edition_id INT NOT NULL DEFAULT 4
        COMMENT 'Numéro de l édition (3, 4...) = cp2i_editions.numero';

-- 4. Mettre les textes existants sur l'édition 3 (2025) si créés avant 2026
UPDATE cp2i_textes
SET edition_id = 3
WHERE created_at < '2026-01-01' AND edition_id = 4;

-- 5. Index pour les requêtes filtrées par édition
CREATE INDEX IF NOT EXISTS idx_cp2i_textes_edition ON cp2i_textes(edition_id);

-- Vérification
SELECT * FROM cp2i_editions;
SELECT COUNT(*) as total, edition_id FROM cp2i_textes GROUP BY edition_id;
