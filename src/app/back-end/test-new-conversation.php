<?php
require_once 'config.php';

$pdo = getDB();

// Créer une nouvelle conversation de test
$stmt = $pdo->prepare("
    INSERT INTO chat_conversations (participant_id, subject, status, priority, created_at, updated_at)
    VALUES (?, 'Test conversation nouvelle', 'open', 'medium', NOW(), NOW())
");
$stmt->execute([14]); // ID d'un participant existant
$conversationId = $pdo->lastInsertId();

echo "<h3>Conversation créée:</h3>";
echo "<p>ID: $conversationId</p>";

// Vérifier immédiatement l'état
$stmt = $pdo->prepare("
    SELECT c.*, 
           CONCAT(a.prenom, ' ', a.nom) as admin_name
    FROM chat_conversations c
    LEFT JOIN cp2i_users a ON c.admin_id = a.id
    WHERE c.id = ?
");
$stmt->execute([$conversationId]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

echo "<p>";
echo "Status: {$row['status']} | ";
echo "Admin ID: " . ($row['admin_id'] ?? 'NULL') . " | ";
echo "Admin: " . ($row['admin_name'] ?? 'Non assigné');
echo "</p>";
?>