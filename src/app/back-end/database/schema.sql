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

-- Tables pour le système de chat support

-- Table des conversations de support
CREATE TABLE IF NOT EXISTS chat_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id INT NOT NULL,
    admin_id INT NULL,
    subject VARCHAR(255) NOT NULL,
    status ENUM('open', 'assigned', 'closed') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_participant (participant_id),
    INDEX idx_admin (admin_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_updated (updated_at)
);

-- Table des messages de chat
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    sender_type ENUM('participant', 'admin') NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_status BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conversation (conversation_id),
    INDEX idx_sender (sender_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_read_status (read_status)
);

-- Table pour les templates de réponses rapides (admin)
CREATE TABLE IF NOT EXISTS chat_quick_replies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    usage_count INT DEFAULT 0,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_category (category),
    INDEX idx_usage (usage_count)
);

-- Données initiales
INSERT INTO users (email, password, nom, prenom, role) VALUES
('admin@cp2i.com', '$2b$10$hash', 'Admin', 'Système', 'admin'),
('correcteur@cp2i.com', '$2b$10$hash', 'Correcteur', 'Principal', 'correcteur');

-- Insérer quelques réponses rapides par défaut
INSERT INTO chat_quick_replies (title, message, category, created_by) VALUES
('Salutation', 'Bonjour ! Merci de nous avoir contactés. Comment puis-je vous aider aujourd''hui ?', 'general', 1),
('Inscription', 'Pour vous inscrire au concours CP2i, rendez-vous sur la page d''inscription et remplissez le formulaire avec vos informations personnelles.', 'inscription', 1),
('Soumission', 'Pour soumettre votre texte, connectez-vous à votre espace participant et cliquez sur "Soumettre un texte".', 'soumission', 1),
('Résultats', 'Les résultats sont généralement publiés 2 semaines après la clôture des soumissions. Vous recevrez une notification par email.', 'resultats', 1),
('Problème technique', 'Je comprends votre problème technique. Pouvez-vous me donner plus de détails sur l''erreur que vous rencontrez ?', 'technique', 1),
('Fermeture', 'Votre demande a été traitée. N''hésitez pas à nous recontacter si vous avez d''autres questions. Bonne journée !', 'general', 1);