<?php
require_once 'config.php';
setCorsHeaders();

$user = verifyToken();
$texte_id = $_GET['texte_id'] ?? 0;

if (!$texte_id) {
    echo json_encode(['corrections' => []]);
    exit;
}

try {
    $db = getDB();
    
    $stmt = $db->prepare("
        SELECT e.*, u.prenom, u.nom 
        FROM cp2i_evaluations e
        JOIN cp2i_users u ON e.correcteur_id = u.id
        WHERE e.texte_id = ?
        ORDER BY e.created_at DESC
    ");
    $stmt->execute([$texte_id]);
    $corrections = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['corrections' => $corrections]);
    
} catch (Exception $e) {
    echo json_encode(['corrections' => []]);
}
?>