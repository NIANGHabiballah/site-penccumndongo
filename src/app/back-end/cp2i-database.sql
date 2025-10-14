-- Base de données CP2i
CREATE DATABASE IF NOT EXISTS u122559880_cp2i_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE u122559880_cp2i_db;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS cp2i_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    role ENUM('participant', 'correcteur', 'admin') DEFAULT 'participant',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des textes soumis
CREATE TABLE IF NOT EXISTS cp2i_textes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    langue ENUM('francais', 'wolof', 'arabe') DEFAULT 'francais',
    nb_vers INT NOT NULL,
    statut ENUM('en_attente', 'accepte', 'refuse') DEFAULT 'en_attente',
    note DECIMAL(4,2) NULL,
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES cp2i_users(id) ON DELETE CASCADE
);

-- Table des corrections
CREATE TABLE IF NOT EXISTS cp2i_corrections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    texte_id INT NOT NULL,
    corrector_id INT NOT NULL,
    note DECIMAL(4,2) NOT NULL,
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (texte_id) REFERENCES cp2i_textes(id) ON DELETE CASCADE,
    FOREIGN KEY (corrector_id) REFERENCES cp2i_users(id) ON DELETE CASCADE
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_textes_user_id ON cp2i_textes(user_id);
CREATE INDEX idx_textes_statut ON cp2i_textes(statut);
CREATE INDEX idx_corrections_texte_id ON cp2i_corrections(texte_id);

-- Données de test (optionnel)
INSERT INTO cp2i_users (email, password, nom, prenom, role) VALUES 
('admin@cp2i.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'CP2i', 'admin'),
('correcteur@cp2i.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Correcteur', 'Test', 'correcteur');