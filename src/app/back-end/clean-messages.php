<?php
require_once 'config.php';
header('Content-Type: application/json');

try {
    $db = getDB();
    
    // Supprimer les doublons dans cp2i_message_recipients
    $stmt = $db->exec("
        DELETE mr1 FROM cp2i_message_recipients mr1
        INNER JOIN cp2i_message_recipients mr2 
        WHERE mr1.id > mr2.id 
        AND mr1.message_id = mr2.message_id 
        AND mr1.recipient_id = mr2.recipient_id
    ");
    
    echo json_encode([
        'success' => true,
        'deleted_duplicates' => $stmt
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>