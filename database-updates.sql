-- Tables pour le chat support avec images

-- Table des conversations de chat
CREATE TABLE IF NOT EXISTS chat_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    participant_id INT NOT NULL,
    admin_id INT NULL,
    subject VARCHAR(255) NOT NULL,
    status ENUM('open', 'assigned', 'closed') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES cp2i_users(id),
    FOREIGN KEY (admin_id) REFERENCES cp2i_users(id)
);

-- Table des messages de chat
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    sender_type ENUM('participant', 'admin') NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_status TINYINT(1) DEFAULT 0,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES cp2i_users(id)
);

-- Ajouter une colonne pour les images dans les messages existants (si nécessaire)
ALTER TABLE cp2i_messages ADD COLUMN images TEXT NULL AFTER content;

-- Index pour optimiser les performances
CREATE INDEX idx_chat_conversations_participant ON chat_conversations(participant_id);
CREATE INDEX idx_chat_conversations_admin ON chat_conversations(admin_id);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_read ON chat_messages(read_status);