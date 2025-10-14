-- Création de la base CP2i dans la base existante
USE u122559880_form_contact;

-- Table des utilisateurs CP2i
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    role ENUM('participant', 'correcteur', 'admin') NOT NULL DEFAULT 'participant',
    statut ENUM('actif', 'inactif', 'suspendu') DEFAULT 'actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    derniere_connexion TIMESTAMP NULL
);

-- Table des textes soumis
CREATE TABLE IF NOT EXISTS textes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    participant_id INT NOT NULL,
    titre VARCHAR(200) NOT NULL,
    contenu TEXT NOT NULL,
    theme VARCHAR(100),
    date_soumission TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut ENUM('soumis', 'en_correction', 'corrige', 'valide') DEFAULT 'soumis',
    note_finale DECIMAL(4,2) NULL,
    FOREIGN KEY (participant_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des corrections
CREATE TABLE IF NOT EXISTS corrections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    texte_id INT NOT NULL,
    correcteur_id INT NOT NULL,
    note DECIMAL(4,2) NOT NULL,
    commentaires TEXT,
    criteres JSON,
    date_correction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (texte_id) REFERENCES textes(id) ON DELETE CASCADE,
    FOREIGN KEY (correcteur_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    expediteur_id INT NOT NULL,
    destinataire_id INT NULL,
    type ENUM('support', 'notification', 'prive') NOT NULL,
    sujet VARCHAR(200),
    contenu TEXT NOT NULL,
    lu BOOLEAN DEFAULT FALSE,
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expediteur_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (destinataire_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_textes_participant ON textes(participant_id);
CREATE INDEX IF NOT EXISTS idx_corrections_texte ON corrections(texte_id);
CREATE INDEX IF NOT EXISTS idx_messages_destinataire ON messages(destinataire_id);

-- Tables pour chatbot
CREATE TABLE IF NOT EXISTS chatbot_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    actif BOOLEAN DEFAULT TRUE,
    nom VARCHAR(100) DEFAULT 'Assistant CP2i',
    message_accueil TEXT,
    langues JSON,
    reponse_automatique BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS chatbot_faq (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question TEXT NOT NULL,
    reponse TEXT NOT NULL,
    categorie VARCHAR(50) DEFAULT 'generale',
    utilisation INT DEFAULT 0,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chatbot_conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    statut ENUM('en_cours', 'resolu_auto', 'transfere_humain') DEFAULT 'en_cours',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Données initiales
INSERT IGNORE INTO users (email, password, nom, prenom, role) VALUES
('admin@cp2i.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'CP2i', 'admin'),
('correcteur@cp2i.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Correcteur', 'Principal', 'correcteur');

-- FAQ par défaut
INSERT IGNORE INTO chatbot_faq (question, reponse, categorie) VALUES
('Comment m\'inscrire au concours ?', 'Pour vous inscrire, cliquez sur "Inscription" et remplissez le formulaire avec vos informations personnelles.', 'inscription'),
('Quand sont les résultats ?', 'Les résultats sont généralement publiés 2 semaines après la clôture des soumissions.', 'resultats'),
('Comment soumettre mon texte ?', 'Connectez-vous à votre tableau de bord et utilisez le formulaire de soumission dans la section "Mes textes".', 'soumission');

-- Configuration chatbot par défaut
INSERT IGNORE INTO chatbot_config (actif, nom, message_accueil, langues, reponse_automatique) VALUES
(TRUE, 'Assistant CP2i', 'Bonjour ! Je suis l\'assistant CP2i. Comment puis-je vous aider ?', '["français", "wolof"]', TRUE);

-- Table des règlements
CREATE TABLE IF NOT EXISTS reglements_cp2i (
    id INT PRIMARY KEY AUTO_INCREMENT,
    edition VARCHAR(10) NOT NULL,
    annee YEAR NOT NULL,
    contenu JSON NOT NULL,
    date_mise_a_jour TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_edition_annee (edition, annee)
);