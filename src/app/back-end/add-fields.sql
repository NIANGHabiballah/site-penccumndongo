-- Ajouter les champs telephone et ville à la table cp2i_users
ALTER TABLE cp2i_users 
ADD COLUMN telephone VARCHAR(20) NULL AFTER prenom,
ADD COLUMN ville VARCHAR(255) NULL AFTER telephone;