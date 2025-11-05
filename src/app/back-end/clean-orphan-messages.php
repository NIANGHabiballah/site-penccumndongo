<?php
require_once 'config.php';
setCorsHeaders();

$db = getDB();

echo "<h2>Nettoyage des Messages Orphelins</h2>";

try {
    // Supprimer les messages sans destinataires (orphelins)
    $stmt = $db->query("
        DELETE m FROM cp2i_messages m
        LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id
        WHERE mr.message_id IS NULL AND m.send_to_all = 0
    ");
    
    $deleted = $stmt->rowCount();
    echo "<p>✅ $deleted messages orphelins supprimés</p>";
    
    // Vérifier qu'il ne reste plus de messages orphelins
    $stmt = $db->query("
        SELECT COUNT(*) as count FROM cp2i_messages m
        LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id
        WHERE mr.message_id IS NULL AND m.send_to_all = 0
    ");
    
    $remaining = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "<p>Messages orphelins restants : $remaining</p>";
    
    if ($remaining == 0) {
        echo "<p><strong>✅ Nettoyage terminé avec succès !</strong></p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Erreur : " . $e->getMessage() . "</p>";
}

echo "<br><a href='debug-messages.php'>Vérifier les messages</a>";
?>