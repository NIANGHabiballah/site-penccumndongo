<?php
require_once 'config.php';
setCorsHeaders();

$payload = verifyToken();
$userId = $payload['userId'];

try {
    $pdo = getDB();
    
    $stmt = $pdo->prepare("
        SELECT 
            c.id,
            c.texte_id,
            c.note,
            c.commentaires,
            c.date_correction,
            t.titre,
            u.nom as participant_nom,
            u.prenom as participant_prenom
        FROM corrections c
        JOIN textes t ON c.texte_id = t.id
        JOIN users u ON t.participant_id = u.id
        WHERE c.correcteur_id = ?
        ORDER BY c.date_correction DESC
    ");
    
    $stmt->execute([$userId]);
    $corrections = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'corrections' => $corrections
    ]);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>