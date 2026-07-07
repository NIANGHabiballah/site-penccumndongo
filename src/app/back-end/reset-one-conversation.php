<?php
require_once 'config.php';

$pdo = getDB();

// Remettre la conversation ID 5 en statut 'open' sans admin
$stmt = $pdo->prepare("
    UPDATE chat_conversations 
    SET status = 'open', admin_id = NULL, updated_at = NOW()
    WHERE id = 5
");
$stmt->execute();

echo "<h3>Conversation ID 5 remise en statut open:</h3>";
echo "<p>Vous devriez maintenant voir l'icône d'assignation sur cette conversation.</p>";
?>