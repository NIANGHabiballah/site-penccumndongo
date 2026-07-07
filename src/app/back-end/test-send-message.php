<?php
require_once 'config.php';
setCorsHeaders();

// Script de test pour envoyer un message
$db = getDB();

echo "<h2>Test d'Envoi de Message</h2>";

// Trouver un admin
$stmt = $db->query("SELECT id, prenom, nom FROM cp2i_users WHERE role = 'admin' LIMIT 1");
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$admin) {
    echo "Aucun admin trouvé.";
    exit;
}

echo "<p>Admin trouvé: {$admin['prenom']} {$admin['nom']} (ID: {$admin['id']})</p>";

// Trouver des participants
$stmt = $db->query("SELECT id, prenom, nom, email FROM cp2i_users WHERE role = 'participant' LIMIT 3");
$participants = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "<p>Participants trouvés: " . count($participants) . "</p>";

if (count($participants) === 0) {
    echo "Aucun participant trouvé.";
    exit;
}

// Simuler l'utilisateur admin
$user = ['user_id' => $admin['id']];

// Données du message de test
$messageData = [
    'subject' => 'Message de Test - ' . date('Y-m-d H:i:s'),
    'content' => 'Ceci est un message de test envoyé pour vérifier le système de messagerie.',
    'send_to_all' => false,
    'recipients' => array_column($participants, 'id')
];

echo "<h3>Données du message:</h3>";
echo "<pre>" . json_encode($messageData, JSON_PRETTY_PRINT) . "</pre>";

// Simuler l'envoi du message
try {
    $subject = $messageData['subject'];
    $content = $messageData['content'];
    $send_to_all = $messageData['send_to_all'];
    
    // Insérer le message
    $stmt = $db->prepare("INSERT INTO cp2i_messages (sender_id, subject, content, send_to_all) VALUES (?, ?, ?, ?)");
    $stmt->execute([$user['user_id'], $subject, $content, $send_to_all ? 1 : 0]);
    $message_id = $db->lastInsertId();
    
    echo "<p>Message créé avec ID: $message_id</p>";
    
    $recipients = $messageData['recipients'];
    $valid_recipients = 0;
    
    echo "<h3>Ajout des destinataires:</h3>";
    foreach ($recipients as $recipient_id) {
        // Vérifier que le destinataire existe
        $stmt = $db->prepare("SELECT id, prenom, nom FROM cp2i_users WHERE id = ? AND id != ?");
        $stmt->execute([$recipient_id, $user['user_id']]);
        $recipient = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($recipient) {
            $stmt = $db->prepare("INSERT INTO cp2i_message_recipients (message_id, recipient_id) VALUES (?, ?)");
            $stmt->execute([$message_id, $recipient_id]);
            $valid_recipients++;
            echo "<p>✓ Destinataire ajouté: {$recipient['prenom']} {$recipient['nom']} (ID: $recipient_id)</p>";
        } else {
            echo "<p>✗ Destinataire invalide: $recipient_id</p>";
        }
    }
    
    echo "<p><strong>Résultat: Message envoyé à $valid_recipients destinataires</strong></p>";
    
    // Vérification finale
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM cp2i_message_recipients WHERE message_id = ?");
    $stmt->execute([$message_id]);
    $final_count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    echo "<p>Vérification finale: $final_count destinataires dans la base</p>";
    
    // Tester la récupération pour un participant
    if (count($participants) > 0) {
        $test_participant = $participants[0];
        echo "<h3>Test de récupération pour {$test_participant['prenom']} {$test_participant['nom']}:</h3>";
        
        $stmt = $db->prepare("
            SELECT m.id, m.subject, m.created_at, mr.read_at
            FROM cp2i_messages m
            LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id AND mr.recipient_id = ?
            WHERE mr.recipient_id = ?
            ORDER BY m.created_at DESC
            LIMIT 5
        ");
        $stmt->execute([$test_participant['id'], $test_participant['id']]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<p>Messages trouvés: " . count($messages) . "</p>";
        
        if (count($messages) > 0) {
            echo "<table border='1'>";
            echo "<tr><th>ID</th><th>Sujet</th><th>Date</th><th>Lu</th></tr>";
            foreach ($messages as $msg) {
                echo "<tr>";
                echo "<td>{$msg['id']}</td>";
                echo "<td>" . htmlspecialchars($msg['subject']) . "</td>";
                echo "<td>{$msg['created_at']}</td>";
                echo "<td>" . ($msg['read_at'] ? 'Oui' : 'Non') . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Erreur: " . $e->getMessage() . "</p>";
}

echo "<br><br><a href='debug-messages.php'>Voir le débogage complet</a>";
?>