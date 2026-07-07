<?php
require_once 'config.php';
setContentType('application/json');

try {
    $db = getDB();
    
    // Vérifier les doublons dans cp2i_affectations
    $stmt = $db->query("
        SELECT texte_id, corrector_id, COUNT(*) as count 
        FROM cp2i_affectations 
        GROUP BY texte_id, corrector_id 
        HAVING COUNT(*) > 1
    ");
    $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Vérifier les textes dupliqués
    $stmt = $db->query("
        SELECT titre, user_id, COUNT(*) as count 
        FROM cp2i_textes 
        GROUP BY titre, user_id 
        HAVING COUNT(*) > 1
    ");
    $duplicate_texts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'affectation_duplicates' => $duplicates,
        'text_duplicates' => $duplicate_texts
    ]);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>