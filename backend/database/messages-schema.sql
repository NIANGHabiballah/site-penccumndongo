-- Schéma pour le système de messages CP2i

-- Table des messages (envoyés par les admins)
CREATE TABLE IF NOT EXISTS cp2i_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    send_to_all BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES cp2i_users(id) ON DELETE CASCADE,
    INDEX idx_sender (sender_id),
    INDEX idx_created (created_at),
    INDEX idx_send_to_all (send_to_all)
);

-- Table des destinataires de messages (pour le suivi de lecture)
CREATE TABLE IF NOT EXISTS cp2i_message_recipients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    recipient_id INT NOT NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES cp2i_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES cp2i_users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_message_recipient (message_id, recipient_id),
    INDEX idx_message (message_id),
    INDEX idx_recipient (recipient_id),
    INDEX idx_read_at (read_at)
);

-- Données de test (optionnel)
INSERT IGNORE INTO cp2i_messages (sender_id, subject, content, send_to_all) VALUES
(1, 'Bienvenue au concours CP2i', 'Nous vous souhaitons la bienvenue au concours de poésie CP2i. Nous vous encourageons à donner le meilleur de vous-même.', TRUE),
(1, 'Rappel des règles', 'N\'oubliez pas de respecter les règles du concours lors de la soumission de vos textes.', TRUE),
(1, 'Nouvelle fonctionnalité', 'Une nouvelle fonctionnalité de chat support est maintenant disponible pour vous aider.', TRUE);