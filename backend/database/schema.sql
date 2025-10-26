-- Base de données CP2i
CREATE DATABASE cp2i_db;
USE cp2i_db;

-- Table des utilisateurs
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    role ENUM('participant', 'correcteur', 'admin') NOT NULL,
    statut ENUM('actif', 'inactif', 'suspendu') DEFAULT 'actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    derniere_connexion TIMESTAMP NULL
);

-- Table des textes soumis
CREATE TABLE textes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    participant_id INT NOT NULL,
    titre VARCHAR(200) NOT NULL,
    contenu TEXT NOT NULL,
    theme VARCHAR(100),
    date_soumission TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('soumis', 'en_correction', 'corrige', 'valide') DEFAULT 'soumis',
    note_finale DECIMAL(4,2) NULL,
    FOREIGN KEY (participant_id) REFERENCES users(id)
);

-- Table des corrections
CREATE TABLE corrections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    texte_id INT NOT NULL,
    correcteur_id INT NOT NULL,
    note DECIMAL(4,2) NOT NULL,
    commentaires TEXT,
    criteres JSON,
    date_correction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (texte_id) REFERENCES textes(id),
    FOREIGN KEY (correcteur_id) REFERENCES users(id)
);

-- Table des messages/chat
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    expediteur_id INT NOT NULL,
    destinataire_id INT NULL,
    type ENUM('support', 'notification', 'prive') NOT NULL,
    sujet VARCHAR(200),
    contenu TEXT NOT NULL,
    lu BOOLEAN DEFAULT FALSE,
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expediteur_id) REFERENCES users(id),
    FOREIGN KEY (destinataire_id) REFERENCES users(id)
);

-- Table des sessions
CREATE TABLE sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT NOT NULL,
    data TEXT,
    expires TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index pour optimisation
CREATE INDEX idx_textes_participant ON textes(participant_id);
CREATE INDEX idx_corrections_texte ON corrections(texte_id);
CREATE INDEX idx_messages_destinataire ON messages(destinataire_id);
CREATE INDEX idx_sessions_expires ON sessions(expires);

-- Données initiales
INSERT INTO users (email, password, nom, prenom, role) VALUES
('admin@cp2i.com', '$2b$10$hash', 'Admin', 'Système', 'admin'),
('correcteur@cp2i.com', '$2b$10$hash', 'Correcteur', 'Principal', 'correcteur');