<?php
require_once 'config.php';

echo "<h2>Test de réception des messages côté participant</h2>";

// Test avec un participant spécifique
$participantId = 1; // Remplacer par un ID valide

try {
    $pdo = getDB();
    
    echo "<h3>1. Vérification du participant</h3>";
    $stmt = $pdo->prepare("SELECT id, nom, prenom, email FROM cp2i_users WHERE id = ? AND role = 'participant'");
    $stmt->execute([$participantId]);
    $participant = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$participant) {
        echo "<p style='color: red;'>❌ Participant ID $participantId non trouvé</p>";
        exit;
    }
    
    echo "<p style='color: green;'>✅ Participant trouvé: {$participant['nom']} {$participant['prenom']} ({$participant['email']})</p>";
    
    echo "<h3>2. Messages disponibles dans la base</h3>";
    $stmt = $pdo->prepare("
        SELECT id, subject, send_to_all, sender_id, created_at 
        FROM cp2i_messages 
        ORDER BY created_at DESC 
        LIMIT 10
    ");
    $stmt->execute();
    $allMessages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>ID</th><th>Sujet</th><th>Collectif</th><th>Expéditeur</th><th>Date</th></tr>";
    foreach ($allMessages as $msg) {
        $collectif = $msg['send_to_all'] ? 'Oui' : 'Non';
        echo "<tr><td>{$msg['id']}</td><td>{$msg['subject']}</td><td>$collectif</td><td>{$msg['sender_id']}</td><td>{$msg['created_at']}</td></tr>";
    }
    echo "</table>";
    
    echo "<h3>3. Test de la requête corrigée</h3>";
    $stmt = $pdo->prepare("
        SELECT DISTINCT
            m.id,
            m.subject,
            m.content,
            m.created_at,
            m.send_to_all,
            mr.read_at,
            u.nom as sender_nom,
            u.prenom as sender_prenom,
            CASE 
                WHEN mr.read_at IS NOT NULL THEN 1 
                ELSE 0 
            END as is_read
        FROM cp2i_messages m
        LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id AND mr.recipient_id = ?
        LEFT JOIN cp2i_users u ON m.sender_id = u.id
        WHERE m.sender_id != ?
          AND (m.send_to_all = 1 OR mr.recipient_id = ?)
        ORDER BY m.created_at DESC
    ");
    $stmt->execute([$participantId, $participantId, $participantId]);
    $participantMessages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<p><strong>Messages récupérés pour le participant:</strong> " . count($participantMessages) . "</p>";
    
    if (count($participantMessages) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>ID</th><th>Sujet</th><th>Collectif</th><th>Lu</th><th>Expéditeur</th><th>Date</th></tr>";
        foreach ($participantMessages as $msg) {
            $collectif = $msg['send_to_all'] ? 'Oui' : 'Non';
            $lu = $msg['is_read'] ? 'Oui' : 'Non';
            $expediteur = $msg['sender_nom'] . ' ' . $msg['sender_prenom'];
            echo "<tr><td>{$msg['id']}</td><td>{$msg['subject']}</td><td>$collectif</td><td>$lu</td><td>$expediteur</td><td>{$msg['created_at']}</td></tr>";
        }
        echo "</table>";
    } else {
        echo "<p style='color: red;'>❌ Aucun message récupéré pour ce participant</p>";
    }
    
    echo "<h3>4. Vérification des entrées message_recipients</h3>";
    $stmt = $pdo->prepare("
        SELECT mr.message_id, mr.recipient_id, mr.read_at, m.subject, m.send_to_all
        FROM cp2i_message_recipients mr
        JOIN cp2i_messages m ON mr.message_id = m.id
        WHERE mr.recipient_id = ?
        ORDER BY mr.message_id DESC
    ");
    $stmt->execute([$participantId]);
    $recipients = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<p><strong>Entrées dans message_recipients:</strong> " . count($recipients) . "</p>";
    
    if (count($recipients) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Message ID</th><th>Sujet</th><th>Collectif</th><th>Lu le</th></tr>";
        foreach ($recipients as $rec) {
            $collectif = $rec['send_to_all'] ? 'Oui' : 'Non';
            $lu = $rec['read_at'] ?: 'Non lu';
            echo "<tr><td>{$rec['message_id']}</td><td>{$rec['subject']}</td><td>$collectif</td><td>$lu</td></tr>";
        }
        echo "</table>";
    }
    
    echo "<h3>5. Messages collectifs sans entrée recipient</h3>";
    $stmt = $pdo->prepare("
        SELECT m.id, m.subject, m.created_at
        FROM cp2i_messages m
        LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id AND mr.recipient_id = ?
        WHERE m.send_to_all = 1 AND mr.id IS NULL
        ORDER BY m.created_at DESC
    ");
    $stmt->execute([$participantId]);
    $missingRecipients = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($missingRecipients) > 0) {
        echo "<p style='color: orange;'>⚠️ Messages collectifs sans entrée recipient: " . count($missingRecipients) . "</p>";
        echo "<p>Ces messages seront automatiquement ajoutés lors de la prochaine récupération.</p>";
    } else {
        echo "<p style='color: green;'>✅ Tous les messages collectifs ont leurs entrées recipient</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Erreur: " . $e->getMessage() . "</p>";
}
?>