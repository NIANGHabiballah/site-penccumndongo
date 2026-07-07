<?php
require_once 'config.php';

$pdo = getDB();

// Créer une nouvelle conversation de test non assignée
$stmt = $pdo->prepare("
    INSERT INTO chat_conversations (participant_id, subject, status, priority, created_at, updated_at)
    VALUES (14, 'Nouvelle demande test', 'open', 'medium', NOW(), NOW())
");
$stmt->execute();
$conversationId = $pdo->lastInsertId();

echo "<h3>Nouvelle conversation créée:</h3>";
echo "<p>ID: $conversationId - Status: open - Non assignée</p>";
echo "<p>Vous devriez maintenant voir l'icône d'assignation sur cette conversation.</p>";
?>