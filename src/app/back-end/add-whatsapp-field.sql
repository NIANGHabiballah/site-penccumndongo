-- Ajouter le champ whatsapp à la table cp2i_users
ALTER TABLE cp2i_users 
ADD COLUMN whatsapp VARCHAR(20) NULL AFTER telephone;