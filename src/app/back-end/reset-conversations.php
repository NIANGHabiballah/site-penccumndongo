<?php
require_once 'config.php';

$pdo = getDB();

// Remettre toutes les conversations en statut 'open' sans admin assigné
$stmt = $pdo->prepare("
    UPDATE chat_conversations 
    SET status = 'open', admin_id = NULL, updated_at = NOW()
    WHERE status = 'assigned'
");
$stmt->execute();

echo "<h3>Conversations remises à zéro:</h3>";
echo "<p>Toutes les conversations assignées ont été remises en statut 'open' sans admin assigné.</p>";

// Afficher le résultat
$stmt = $pdo->query("
    SELECT c.*, u.nom, u.prenom, u.email,
           CONCAT(u.prenom, ' ', u.nom) as user_name,
           CONCAT(a.prenom, ' ', a.nom) as admin_name
    FROM chat_conversations c
    JOIN cp2i_users u ON c.participant_id = u.id
    LEFT JOIN cp2i_users a ON c.admin_id = a.id
    ORDER BY c.created_at DESC
");

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "<p>";
    echo "ID: {$row['id']} | ";
    echo "Sujet: {$row['subject']} | ";
    echo "Status: {$row['status']} | ";
    echo "Admin: " . ($row['admin_name'] ?? 'Non assigné');
    echo "</p>";
}
?>