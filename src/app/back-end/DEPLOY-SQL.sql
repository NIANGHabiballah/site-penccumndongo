-- =====================================================
-- REQUÊTES SQL POUR DÉPLOIEMENT CP2i
-- Base de données: u122559880_cp2i_db
-- =====================================================

-- 1. UTILISER LA BASE DE DONNÉES EXISTANTE
USE u122559880_form_contact;

-- 2. TABLE DES UTILISATEURS CP2i
CREATE TABLE IF NOT EXISTS cp2i_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    role ENUM('participant', 'correcteur', 'admin') DEFAULT 'participant',
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. TABLE DES TEXTES SOUMIS
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

-- 4. TABLE DES CORRECTIONS
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

-- 5. TABLE D'AFFECTATION CORRECTEURS-PARTICIPANTS
CREATE TABLE IF NOT EXISTS cp2i_affectations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id INT NOT NULL,
    corrector_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES cp2i_users(id) ON DELETE CASCADE,
    FOREIGN KEY (corrector_id) REFERENCES cp2i_users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_affectation (participant_id, corrector_id)
);

-- 6. INDEX POUR OPTIMISER LES PERFORMANCES
CREATE INDEX idx_cp2i_textes_user_id ON cp2i_textes(user_id);
CREATE INDEX idx_cp2i_textes_statut ON cp2i_textes(statut);
CREATE INDEX idx_cp2i_corrections_texte_id ON cp2i_corrections(texte_id);
CREATE INDEX idx_cp2i_users_email ON cp2i_users(email);
CREATE INDEX idx_cp2i_users_verification_token ON cp2i_users(verification_token);

-- 7. DONNÉES DE TEST (OPTIONNEL)
-- Mot de passe pour tous les comptes de test: "password123"
INSERT IGNORE INTO cp2i_users (email, password, nom, prenom, role, email_verified) VALUES 
('admin@cp2i.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'CP2i', 'admin', TRUE),
('correcteur@cp2i.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Correcteur', 'Test', 'correcteur', TRUE),
('participant@cp2i.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Participant', 'Test', 'participant', TRUE),
('pencc.penccumndongo@gmail.com', '$2y$10$N9qo8uLOickgx2ZMRd6M/.VjqrIpzngiV/Eoo1ORRe.1Q2J9S', 'NDONGO', 'Penccum', 'admin', TRUE);

-- COMPTE ADMIN PENCCUM NDONGO
-- Email: pencc.penccumndongo@gmail.com
-- Mot de passe: 1234
-- Rôle: admin

-- 8. VÉRIFICATION DES TABLES CRÉÉES
SHOW TABLES LIKE 'cp2i_%';

-- 9. VÉRIFICATION DE LA STRUCTURE
DESCRIBE cp2i_users;
DESCRIBE cp2i_textes;
DESCRIBE cp2i_corrections;