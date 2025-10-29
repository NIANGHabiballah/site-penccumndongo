<?php
require_once 'config.php';
header('Content-Type: application/json');
setCorsHeaders();

// Script de test pour vérifier le système de messages

try {
    $pdo = getDB();
    
    // Vérifier si les tables existent
    $tables = ['cp2i_messages', 'cp2i_message_recipients', 'cp2i_users'];
    $existingTables = [];
    
    foreach ($tables as $table) {
        $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
        $stmt->execute([$table]);
        if ($stmt->fetch()) {
            $existingTables[] = $table;
        }
    }
    
    // Compter les messages
    $messageCount = 0;
    $recipientCount = 0;
    $userCount = 0;
    
    if (in_array('cp2i_messages', $existingTables)) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM cp2i_messages");
        $messageCount = $stmt->fetchColumn();
    }
    
    if (in_array('cp2i_message_recipients', $existingTables)) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM cp2i_message_recipients");
        $recipientCount = $stmt->fetchColumn();
    }
    
    if (in_array('cp2i_users', $existingTables)) {
        $stmt = $pdo->query("SELECT COUNT(*) FROM cp2i_users");
        $userCount = $stmt->fetchColumn();
    }
    
    // Récupérer quelques messages de test
    $sampleMessages = [];
    if (in_array('cp2i_messages', $existingTables)) {
        $stmt = $pdo->query("SELECT id, subject, content, send_to_all, created_at FROM cp2i_messages LIMIT 3");
        $sampleMessages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    echo json_encode([
        'success' => true,
        'database_status' => [
            'existing_tables' => $existingTables,
            'missing_tables' => array_diff($tables, $existingTables),
            'message_count' => $messageCount,
            'recipient_count' => $recipientCount,
            'user_count' => $userCount
        ],
        'sample_messages' => $sampleMessages,
        'recommendations' => [
            'create_missing_tables' => !empty(array_diff($tables, $existingTables)),
            'add_test_data' => $messageCount === 0,
            'system_ready' => count($existingTables) === 3 && $messageCount > 0
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'recommendations' => [
            'check_database_connection' => true,
            'verify_config' => true
        ]
    ]);
}
?>