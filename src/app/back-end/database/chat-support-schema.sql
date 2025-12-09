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

-- Table pour les notifications de chat
CREATE TABLE IF NOT EXISTS chat_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    conversation_id INT NOT NULL,
    message_id INT NOT NULL,
    type ENUM('new_message', 'conversation_assigned', 'conversation_closed') NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read_status (read_status),
    INDEX idx_created (created_at)
);

-- Insérer quelques réponses rapides par défaut
INSERT INTO chat_quick_replies (title, message, category, created_by) VALUES
('Salutation', 'Bonjour ! Merci de nous avoir contactés. Comment puis-je vous aider aujourd''hui ?', 'general', 1),
('Inscription', 'Pour vous inscrire au concours CP2i, rendez-vous sur la page d''inscription et remplissez le formulaire avec vos informations personnelles.', 'inscription', 1),
('Soumission', 'Pour soumettre votre texte, connectez-vous à votre espace participant et cliquez sur "Soumettre un texte".', 'soumission', 1),
('Résultats', 'Les résultats sont généralement publiés 2 semaines après la clôture des soumissions. Vous recevrez une notification par email.', 'resultats', 1),
('Problème technique', 'Je comprends votre problème technique. Pouvez-vous me donner plus de détails sur l''erreur que vous rencontrez ?', 'technique', 1),
('Fermeture', 'Votre demande a été traitée. N''hésitez pas à nous recontacter si vous avez d''autres questions. Bonne journée !', 'general', 1);

-- Vues pour faciliter les requêtes

-- Vue des conversations avec informations utilisateur
CREATE OR REPLACE VIEW chat_conversations_view AS
SELECT 
    c.*,
    p.nom as participant_nom,
    p.prenom as participant_prenom,
    p.email as participant_email,
    a.nom as admin_nom,
    a.prenom as admin_prenom,
    (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id AND m.read_status = 0 AND m.sender_type = 'participant') as unread_participant_messages,
    (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id AND m.read_status = 0 AND m.sender_type = 'admin') as unread_admin_messages,
    (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id) as total_messages
FROM chat_conversations c
JOIN users p ON c.participant_id = p.id
LEFT JOIN users a ON c.admin_id = a.id;

-- Vue des messages avec informations utilisateur
CREATE OR REPLACE VIEW chat_messages_view AS
SELECT 
    m.*,
    u.nom as sender_nom,
    u.prenom as sender_prenom,
    c.subject as conversation_subject,
    c.status as conversation_status
FROM chat_messages m
JOIN users u ON m.sender_id = u.id
JOIN chat_conversations c ON m.conversation_id = c.id;