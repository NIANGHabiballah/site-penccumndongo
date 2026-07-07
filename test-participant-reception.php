<?php
require_once 'src/app/back-end/config.php';

echo "<h2>Test de réception des messages côté participant v2</h2>";

try {
    $pdo = getDB();
    
    echo "<h3>1. Tous les utilisateurs</h3>";
    $stmt = $pdo->prepare("SELECT id, nom, prenom, email, role FROM cp2i_users LIMIT 10");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($users as $u) {
        echo "<p>ID {$u['id']}: {$u['nom']} {$u['prenom']} - Role: {$u['role']}</p>";
    }
    
    $participants = array_filter($users, function($u) { return $u['role'] === 'participant'; });
    
    if (empty($participants)) {
        echo "<p style='color: red;'>❌ Aucun participant trouvé</p>";
        exit;
    }
    
    $participant = reset($participants);
    $participantId = $participant['id'];
    
    echo "<p style='color: green;'>✅ {$participant['nom']} {$participant['prenom']}</p>";
    
    echo "<h3>2. Messages disponibles</h3>";
    $stmt = $pdo->prepare("SELECT id, subject, send_to_all, sender_id FROM cp2i_messages ORDER BY created_at DESC LIMIT 5");
    $stmt->execute();
    $allMessages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($allMessages as $msg) {
        $collectif = $msg['send_to_all'] ? 'Collectif' : 'Individuel';
        echo "<p>ID {$msg['id']}: {$msg['subject']} ($collectif)</p>";
    }
    
    echo "<h3>3. Messages récupérés pour le participant</h3>";
    $stmt = $pdo->prepare("
        SELECT DISTINCT m.id, m.subject, m.send_to_all, mr.read_at
        FROM cp2i_messages m
        LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id AND mr.recipient_id = ?
        WHERE m.sender_id != ? AND (m.send_to_all = 1 OR mr.recipient_id = ?)
        ORDER BY m.created_at DESC
    ");
    $stmt->execute([$participantId, $participantId, $participantId]);
    $participantMessages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<p><strong>Total:</strong> " . count($participantMessages) . "</p>";
    
    foreach ($participantMessages as $msg) {
        $collectif = $msg['send_to_all'] ? 'Collectif' : 'Individuel';
        $lu = $msg['read_at'] ? 'Lu' : 'Non lu';
        echo "<p>ID {$msg['id']}: {$msg['subject']} ($collectif, $lu)</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Erreur: " . $e->getMessage() . "</p>";
}
?>