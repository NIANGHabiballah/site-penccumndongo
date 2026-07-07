<?php
require_once 'config.php';
setCorsHeaders();

// Script de test pour vérifier les messages
$db = getDB();

echo "<h2>Test des Messages CP2i</h2>";

// 1. Vérifier la structure des tables
echo "<h3>1. Structure des tables</h3>";
try {
    $stmt = $db->query("DESCRIBE cp2i_messages");
    echo "<h4>Table cp2i_messages:</h4>";
    echo "<table border='1'><tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "<tr><td>{$row['Field']}</td><td>{$row['Type']}</td><td>{$row['Null']}</td><td>{$row['Key']}</td><td>{$row['Default']}</td></tr>";
    }
    echo "</table>";
    
    $stmt = $db->query("DESCRIBE cp2i_message_recipients");
    echo "<h4>Table cp2i_message_recipients:</h4>";
    echo "<table border='1'><tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "<tr><td>{$row['Field']}</td><td>{$row['Type']}</td><td>{$row['Key']}</td><td>{$row['Default']}</td></tr>";
    }
    echo "</table>";
} catch (Exception $e) {
    echo "Erreur structure: " . $e->getMessage();
}

// 2. Compter les messages
echo "<h3>2. Statistiques des messages</h3>";
try {
    $stmt = $db->query("SELECT COUNT(*) as total FROM cp2i_messages");
    $total_messages = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    echo "Total messages: $total_messages<br>";
    
    $stmt = $db->query("SELECT COUNT(*) as total FROM cp2i_message_recipients");
    $total_recipients = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    echo "Total destinataires: $total_recipients<br>";
    
    $stmt = $db->query("SELECT COUNT(DISTINCT recipient_id) as unique_recipients FROM cp2i_message_recipients");
    $unique_recipients = $stmt->fetch(PDO::FETCH_ASSOC)['unique_recipients'];
    echo "Destinataires uniques: $unique_recipients<br>";
} catch (Exception $e) {
    echo "Erreur stats: " . $e->getMessage();
}

// 3. Lister les derniers messages
echo "<h3>3. Derniers messages envoyés</h3>";
try {
    $stmt = $db->query("
        SELECT m.id, m.subject, m.send_to_all, m.created_at,
               CONCAT(u.prenom, ' ', u.nom) as sender_name,
               COUNT(mr.id) as recipient_count
        FROM cp2i_messages m
        LEFT JOIN cp2i_users u ON m.sender_id = u.id
        LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id
        GROUP BY m.id
        ORDER BY m.created_at DESC
        LIMIT 10
    ");
    
    echo "<table border='1'>";
    echo "<tr><th>ID</th><th>Sujet</th><th>Expéditeur</th><th>Collectif</th><th>Destinataires</th><th>Date</th></tr>";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "<tr>";
        echo "<td>{$row['id']}</td>";
        echo "<td>{$row['subject']}</td>";
        echo "<td>{$row['sender_name']}</td>";
        echo "<td>" . ($row['send_to_all'] ? 'Oui' : 'Non') . "</td>";
        echo "<td>{$row['recipient_count']}</td>";
        echo "<td>{$row['created_at']}</td>";
        echo "</tr>";
    }
    echo "</table>";
} catch (Exception $e) {
    echo "Erreur messages: " . $e->getMessage();
}

// 4. Vérifier les destinataires d'un message spécifique
echo "<h3>4. Détail des destinataires (dernier message)</h3>";
try {
    $stmt = $db->query("SELECT id FROM cp2i_messages ORDER BY created_at DESC LIMIT 1");
    $last_message = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($last_message) {
        $message_id = $last_message['id'];
        $stmt = $db->prepare("
            SELECT mr.recipient_id, mr.read_at,
                   CONCAT(u.prenom, ' ', u.nom) as recipient_name,
                   u.email, u.role
            FROM cp2i_message_recipients mr
            JOIN cp2i_users u ON mr.recipient_id = u.id
            WHERE mr.message_id = ?
            ORDER BY u.prenom, u.nom
        ");
        $stmt->execute([$message_id]);
        
        echo "Destinataires du message ID $message_id:<br>";
        echo "<table border='1'>";
        echo "<tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Lu</th></tr>";
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo "<tr>";
            echo "<td>{$row['recipient_name']}</td>";
            echo "<td>{$row['email']}</td>";
            echo "<td>{$row['role']}</td>";
            echo "<td>" . ($row['read_at'] ? 'Oui' : 'Non') . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "Aucun message trouvé.";
    }
} catch (Exception $e) {
    echo "Erreur destinataires: " . $e->getMessage();
}

// 5. Vérifier les utilisateurs disponibles
echo "<h3>5. Utilisateurs disponibles</h3>";
try {
    $stmt = $db->query("
        SELECT role, COUNT(*) as count
        FROM cp2i_users
        GROUP BY role
        ORDER BY role
    ");
    
    echo "Répartition par rôle:<br>";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "{$row['role']}: {$row['count']}<br>";
    }
} catch (Exception $e) {
    echo "Erreur utilisateurs: " . $e->getMessage();
}

// 6. Test de création d'un message de test
if (isset($_GET['test_send'])) {
    echo "<h3>6. Test d'envoi de message</h3>";
    try {
        // Trouver un admin
        $stmt = $db->query("SELECT id FROM cp2i_users WHERE role = 'admin' LIMIT 1");
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($admin) {
            $admin_id = $admin['id'];
            
            // Créer un message de test
            $stmt = $db->prepare("INSERT INTO cp2i_messages (sender_id, subject, content, send_to_all) VALUES (?, ?, ?, ?)");
            $stmt->execute([$admin_id, 'Test Message', 'Ceci est un message de test', 1]);
            $message_id = $db->lastInsertId();
            
            // Ajouter tous les destinataires
            $stmt = $db->prepare("SELECT id FROM cp2i_users WHERE id != ?");
            $stmt->execute([$admin_id]);
            $recipients = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            foreach ($recipients as $recipient_id) {
                $stmt = $db->prepare("INSERT INTO cp2i_message_recipients (message_id, recipient_id) VALUES (?, ?)");
                $stmt->execute([$message_id, $recipient_id]);
            }
            
            echo "Message de test créé avec succès (ID: $message_id) pour " . count($recipients) . " destinataires.";
        } else {
            echo "Aucun admin trouvé pour le test.";
        }
    } catch (Exception $e) {
        echo "Erreur test: " . $e->getMessage();
    }
}

echo "<br><br><a href='?test_send=1'>Créer un message de test</a>";
?>