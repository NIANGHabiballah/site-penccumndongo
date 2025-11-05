<?php
require_once 'config.php';
setCorsHeaders();

$db = getDB();

echo "<h2>Correction Rapide des Messages</h2>";

try {
    // 1. Trouver un admin
    $stmt = $db->query("SELECT id, prenom, nom FROM cp2i_users WHERE role = 'admin' LIMIT 1");
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$admin) {
        echo "❌ Aucun admin trouvé";
        exit;
    }
    
    echo "✅ Admin trouvé: {$admin['prenom']} {$admin['nom']}<br>";
    
    // 2. Trouver des participants
    $stmt = $db->query("SELECT id, prenom, nom FROM cp2i_users WHERE role != 'admin' LIMIT 5");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "✅ Utilisateurs trouvés: " . count($users) . "<br>";
    
    // 3. Créer un message de test
    $subject = "Test Message - " . date('Y-m-d H:i:s');
    $content = "Ceci est un message de test pour vérifier que le système fonctionne correctement.";
    
    $stmt = $db->prepare("INSERT INTO cp2i_messages (sender_id, subject, content, send_to_all) VALUES (?, ?, ?, 0)");
    $stmt->execute([$admin['id'], $subject, $content]);
    $message_id = $db->lastInsertId();
    
    echo "✅ Message créé avec ID: $message_id<br>";
    
    // 4. Ajouter tous les utilisateurs comme destinataires
    $added = 0;
    foreach ($users as $user) {
        $stmt = $db->prepare("INSERT INTO cp2i_message_recipients (message_id, recipient_id) VALUES (?, ?)");
        $stmt->execute([$message_id, $user['id']]);
        $added++;
        echo "✅ Destinataire ajouté: {$user['prenom']} {$user['nom']}<br>";
    }
    
    echo "<br><strong>✅ Message de test envoyé à $added destinataires</strong><br>";
    
    // 5. Vérifier pour un utilisateur
    if (count($users) > 0) {
        $test_user = $users[0];
        echo "<br><h3>Test de réception pour {$test_user['prenom']} {$test_user['nom']}:</h3>";
        
        $stmt = $db->prepare("
            SELECT m.id, m.subject, m.created_at
            FROM cp2i_messages m
            JOIN cp2i_message_recipients mr ON m.id = mr.message_id
            WHERE mr.recipient_id = ?
            ORDER BY m.created_at DESC
            LIMIT 3
        ");
        $stmt->execute([$test_user['id']]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "Messages trouvés: " . count($messages) . "<br>";
        foreach ($messages as $msg) {
            echo "- {$msg['subject']} ({$msg['created_at']})<br>";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage();
}

echo "<br><br><a href='debug-messages.php'>Voir diagnostic complet</a>";
?>