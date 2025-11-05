<?php
require_once 'config.php';
setCorsHeaders();

// Script de débogage pour les messages
$db = getDB();

echo "<h2>Débogage des Messages CP2i</h2>";

// 1. Vérifier les derniers messages envoyés
echo "<h3>1. Derniers messages envoyés</h3>";
try {
    $stmt = $db->query("
        SELECT m.id, m.subject, m.content, m.send_to_all, m.created_at,
               CONCAT(u.prenom, ' ', u.nom) as sender_name,
               COUNT(mr.id) as recipient_count
        FROM cp2i_messages m
        LEFT JOIN cp2i_users u ON m.sender_id = u.id
        LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id
        GROUP BY m.id
        ORDER BY m.created_at DESC
        LIMIT 5
    ");
    
    echo "<table border='1'>";
    echo "<tr><th>ID</th><th>Sujet</th><th>Expéditeur</th><th>Collectif</th><th>Destinataires</th><th>Date</th></tr>";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "<tr>";
        echo "<td>{$row['id']}</td>";
        echo "<td>" . htmlspecialchars($row['subject']) . "</td>";
        echo "<td>{$row['sender_name']}</td>";
        echo "<td>" . ($row['send_to_all'] ? 'Oui' : 'Non') . "</td>";
        echo "<td>{$row['recipient_count']}</td>";
        echo "<td>{$row['created_at']}</td>";
        echo "</tr>";
    }
    echo "</table>";
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage();
}

// 2. Vérifier les destinataires du dernier message
echo "<h3>2. Destinataires du dernier message</h3>";
try {
    $stmt = $db->query("SELECT id, subject, send_to_all FROM cp2i_messages ORDER BY created_at DESC LIMIT 1");
    $last_message = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($last_message) {
        echo "<p>Message: \"{$last_message['subject']}\" (ID: {$last_message['id']}, Collectif: " . ($last_message['send_to_all'] ? 'Oui' : 'Non') . ")</p>";
        
        $stmt = $db->prepare("
            SELECT mr.recipient_id, mr.read_at,
                   CONCAT(u.prenom, ' ', u.nom) as recipient_name,
                   u.email, u.role
            FROM cp2i_message_recipients mr
            JOIN cp2i_users u ON mr.recipient_id = u.id
            WHERE mr.message_id = ?
            ORDER BY u.prenom, u.nom
        ");
        $stmt->execute([$last_message['id']]);
        
        echo "<table border='1'>";
        echo "<tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Lu</th></tr>";
        $count = 0;
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo "<tr>";
            echo "<td>{$row['recipient_name']}</td>";
            echo "<td>{$row['email']}</td>";
            echo "<td>{$row['role']}</td>";
            echo "<td>" . ($row['read_at'] ? 'Oui' : 'Non') . "</td>";
            echo "</tr>";
            $count++;
        }
        echo "</table>";
        echo "<p>Total destinataires: $count</p>";
    } else {
        echo "Aucun message trouvé.";
    }
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage();
}

// 3. Vérifier tous les utilisateurs disponibles
echo "<h3>3. Utilisateurs disponibles pour recevoir des messages</h3>";
try {
    $stmt = $db->query("
        SELECT id, CONCAT(prenom, ' ', nom) as name, email, role
        FROM cp2i_users
        WHERE role != 'admin'
        ORDER BY role, prenom, nom
    ");
    
    echo "<table border='1'>";
    echo "<tr><th>ID</th><th>Nom</th><th>Email</th><th>Rôle</th></tr>";
    $total_users = 0;
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "<tr>";
        echo "<td>{$row['id']}</td>";
        echo "<td>{$row['name']}</td>";
        echo "<td>{$row['email']}</td>";
        echo "<td>{$row['role']}</td>";
        echo "</tr>";
        $total_users++;
    }
    echo "</table>";
    echo "<p>Total utilisateurs non-admin: $total_users</p>";
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage();
}

// 4. Test de récupération de messages pour un participant spécifique
echo "<h3>4. Test de récupération pour un participant</h3>";
try {
    $stmt = $db->query("SELECT id, prenom, nom FROM cp2i_users WHERE role = 'participant' LIMIT 1");
    $participant = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($participant) {
        echo "<p>Test pour: {$participant['prenom']} {$participant['nom']} (ID: {$participant['id']})</p>";
        
        $stmt = $db->prepare("
            SELECT 
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
            WHERE mr.recipient_id = ?
            ORDER BY m.created_at DESC
        ");
        $stmt->execute([$participant['id'], $participant['id']]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<p>Messages trouvés: " . count($messages) . "</p>";
        
        if (count($messages) > 0) {
            echo "<table border='1'>";
            echo "<tr><th>Sujet</th><th>Expéditeur</th><th>Date</th><th>Lu</th></tr>";
            foreach ($messages as $msg) {
                echo "<tr>";
                echo "<td>" . htmlspecialchars($msg['subject']) . "</td>";
                echo "<td>{$msg['sender_prenom']} {$msg['sender_nom']}</td>";
                echo "<td>{$msg['created_at']}</td>";
                echo "<td>" . ($msg['is_read'] ? 'Oui' : 'Non') . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
    } else {
        echo "Aucun participant trouvé.";
    }
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage();
}

// 5. Vérifier les messages orphelins (sans destinataires)
echo "<h3>5. Messages sans destinataires</h3>";
try {
    $stmt = $db->query("
        SELECT m.id, m.subject, m.send_to_all, m.created_at
        FROM cp2i_messages m
        LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id
        WHERE mr.message_id IS NULL AND m.send_to_all = 0
        ORDER BY m.created_at DESC
    ");
    
    $orphan_messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<p>Messages orphelins trouvés: " . count($orphan_messages) . "</p>";
    
    if (count($orphan_messages) > 0) {
        echo "<table border='1'>";
        echo "<tr><th>ID</th><th>Sujet</th><th>Date</th></tr>";
        foreach ($orphan_messages as $msg) {
            echo "<tr>";
            echo "<td>{$msg['id']}</td>";
            echo "<td>" . htmlspecialchars($msg['subject']) . "</td>";
            echo "<td>{$msg['created_at']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage();
}

echo "<br><br><a href='test-messages.php'>Voir le test complet des messages</a>";
?>