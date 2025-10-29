<?php
require_once 'src/app/back-end/config.php';

$pdo = getDB();

echo "<h3>Conversations actuelles:</h3>";
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
    echo "Participant: {$row['user_name']} | ";
    echo "Admin: " . ($row['admin_name'] ?? 'Non assigné') . " | ";
    echo "Admin ID: " . ($row['admin_id'] ?? 'NULL') . " | ";
    echo "Créé: {$row['created_at']}";
    echo "</p>";
}

echo "<h3>Utilisateurs admins:</h3>";
$stmt = $pdo->query("SELECT id, nom, prenom, email, role FROM cp2i_users WHERE role = 'admin'");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "<p>ID: {$row['id']} | Nom: {$row['prenom']} {$row['nom']} | Email: {$row['email']}</p>";
}
?>