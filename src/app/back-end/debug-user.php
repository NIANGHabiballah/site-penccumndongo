<?php
require_once 'config.php';
header('Content-Type: application/json');

try {
    $payload = verifyToken();
    $userId = $payload['userId'];
    
    $pdo = getDB();
    
    // Vérifier si cet utilisateur a des textes
    $stmt = $pdo->prepare("SELECT id, titre FROM cp2i_textes WHERE user_id = ?");
    $stmt->execute([$userId]);
    $textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Vérifier si cet utilisateur a des évaluations
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as nb_eval 
        FROM cp2i_textes t 
        JOIN cp2i_evaluations e ON t.id = e.texte_id 
        WHERE t.user_id = ?
    ");
    $stmt->execute([$userId]);
    $nbEval = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'user_id' => $userId,
        'textes' => $textes,
        'nb_evaluations' => $nbEval['nb_eval']
    ]);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>