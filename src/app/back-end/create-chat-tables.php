<?php
require_once 'config.php';

try {
    $pdo = getDB();
    
    // Créer la table des conversations de chat
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS chat_conversations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            participant_id INT NOT NULL,
            admin_id INT NULL,
            subject VARCHAR(255) NOT NULL,
            status ENUM('open', 'assigned', 'closed') DEFAULT 'open',
            priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_participant (participant_id),
            INDEX idx_admin (admin_id),
            INDEX idx_status (status),
            INDEX idx_priority (priority),
            INDEX idx_updated (updated_at)
        )
    ");
    
    // Créer la table des messages de chat
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            conversation_id INT NOT NULL,
            sender_id INT NOT NULL,
            sender_type ENUM('participant', 'admin') NOT NULL,
            message TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read_status BOOLEAN DEFAULT FALSE,
            INDEX idx_conversation (conversation_id),
            INDEX idx_sender (sender_id),
            INDEX idx_timestamp (timestamp),
            INDEX idx_read_status (read_status)
        )
    ");
    
    // Créer la table des réponses rapides
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS chat_quick_replies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(100) NOT NULL,
            message TEXT NOT NULL,
            category VARCHAR(50) DEFAULT 'general',
            usage_count INT DEFAULT 0,
            created_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_category (category),
            INDEX idx_usage (usage_count)
        )
    ");
    
    echo json_encode([
        'success' => true,
        'message' => 'Tables de chat créées avec succès'
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>