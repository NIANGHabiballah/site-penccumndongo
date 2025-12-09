<?php
require_once 'config.php';
setCorsHeaders();

$db = getDB();

if (!isset($_GET['texte_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'texte_id requis']);
    exit;
}

$texte_id = (int)$_GET['texte_id'];

try {
    // Récupérer toutes les évaluations pour ce texte_id
    $stmt = $db->prepare("
        SELECT 
            id,
            texte_id,
            correcteur_id,
            pertinence,
            coherence,
            correction,
            presentation,
            note_totale,
            remarques,
            created_at
        FROM cp2i_evaluations 
        WHERE texte_id = ? 
        ORDER BY created_at ASC
    ");
    
    $stmt->execute([$texte_id]);
    $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($evaluations);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur lors de la récupération des évaluations']);
}
?>