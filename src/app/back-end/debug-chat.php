<?php
require_once 'config.php';

header('Content-Type: application/json');
setCorsHeaders();

try {
    $pdo = getDB();
    
    // Test de base
    echo json_encode([
        'success' => true,
        'message' => 'API chat fonctionne',
        'tables' => [
            'conversations' => $pdo->query("SELECT COUNT(*) FROM chat_conversations")->fetchColumn(),
            'messages' => $pdo->query("SELECT COUNT(*) FROM chat_messages")->fetchColumn(),
            'quick_replies' => $pdo->query("SELECT COUNT(*) FROM chat_quick_replies")->fetchColumn()
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>