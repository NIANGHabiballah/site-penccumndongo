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
            FOREIGN KEY (participant_id) REFERENCES cp2i_users(id) ON DELETE CASCADE,
            FOREIGN KEY (admin_id) REFERENCES cp2i_users(id) ON DELETE SET NULL,
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
            FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
            FOREIGN KEY (sender_id) REFERENCES cp2i_users(id) ON DELETE CASCADE,
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
            FOREIGN KEY (created_by) REFERENCES cp2i_users(id) ON DELETE CASCADE,
            INDEX idx_category (category),
            INDEX idx_usage (usage_count)
        )
    ");
    
    // Insérer des réponses rapides par défaut si elles n'existent pas
    $stmt = $pdo->query("SELECT COUNT(*) FROM chat_quick_replies");
    if ($stmt->fetchColumn() == 0) {
        // Trouver un utilisateur admin existant
        $adminStmt = $pdo->query("SELECT id FROM cp2i_users WHERE role = 'admin' LIMIT 1");
        $adminId = $adminStmt->fetchColumn();
        
        if ($adminId) {
            $stmt = $pdo->prepare("
                INSERT INTO chat_quick_replies (title, message, category, created_by) VALUES
                (?, ?, 'general', ?),
                (?, ?, 'inscription', ?),
                (?, ?, 'soumission', ?),
                (?, ?, 'resultats', ?),
                (?, ?, 'technique', ?),
                (?, ?, 'general', ?)
            ");
            $stmt->execute([
                'Salutation', 'Bonjour ! Merci de nous avoir contactés. Comment puis-je vous aider aujourd''hui ?', $adminId,
                'Inscription', 'Pour vous inscrire au concours CP2i, rendez-vous sur la page d''inscription et remplissez le formulaire avec vos informations personnelles.', $adminId,
                'Soumission', 'Pour soumettre votre texte, connectez-vous à votre espace participant et cliquez sur "Soumettre un texte".', $adminId,
                'Résultats', 'Les résultats sont généralement publiés 2 semaines après la clôture des soumissions. Vous recevrez une notification par email.', $adminId,
                'Problème technique', 'Je comprends votre problème technique. Pouvez-vous me donner plus de détails sur l''erreur que vous rencontrez ?', $adminId,
                'Fermeture', 'Votre demande a été traitée. N''hésitez pas à nous recontacter si vous avez d''autres questions. Bonne journée !', $adminId
            ]);
        }
    }
    
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