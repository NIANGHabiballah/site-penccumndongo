-- Migration : Ajout des dates détaillées par édition
USE u122559880_form_contact;

ALTER TABLE cp2i_editions
    ADD COLUMN IF NOT EXISTS inscription_debut   DATE NULL,
    ADD COLUMN IF NOT EXISTS inscription_fin     DATE NULL,
    ADD COLUMN IF NOT EXISTS correction_debut    DATE NULL,
    ADD COLUMN IF NOT EXISTS correction_fin      DATE NULL,
    ADD COLUMN IF NOT EXISTS correction_prolongement DATE NULL,
    ADD COLUMN IF NOT EXISTS deliberation        DATE NULL,
    ADD COLUMN IF NOT EXISTS ceremonie_remise    DATE NULL;

-- Dates réelles de la 3ème édition (2025)
UPDATE cp2i_editions SET
    inscription_debut        = '2025-11-03',
    inscription_fin          = '2025-11-23',
    correction_debut         = '2025-11-24',
    correction_fin           = '2025-11-30',
    correction_prolongement  = '2025-11-30',
    deliberation             = '2025-12-01',
    ceremonie_remise         = '2026-01-10'
WHERE numero = 3;

-- Dates de la 4ème édition (2026)
UPDATE cp2i_editions SET
    inscription_debut        = '2026-11-02',
    inscription_fin          = '2026-11-23',
    correction_debut         = '2026-11-24',
    correction_fin           = '2026-11-30',
    correction_prolongement  = '2026-11-30',
    deliberation             = '2026-12-01',
    ceremonie_remise         = '2026-12-26'
WHERE numero = 4;

SELECT numero, label, inscription_debut, inscription_fin, ceremonie_remise FROM cp2i_editions ORDER BY numero;
