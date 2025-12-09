<?php
require_once 'config.php';
setCorsHeaders();

try {
    // Vérifier l'authentification
    $payload = verifyToken();
    $userId = $payload['userId'];
    
    $pdo = getDB();
    
    // Récupérer les textes du participant avec leurs évaluations
    $stmt = $pdo->prepare("
        SELECT 
            t.id as texte_id,
            t.titre,
            t.statut,
            t.user_id,
            e.id as evaluation_id,
            e.correcteur_id,
            e.pertinence,
            e.coherence,
            e.correction,
            e.presentation,
            e.note_totale,
            e.remarques,
            e.created_at as evaluation_date
        FROM cp2i_textes t
        LEFT JOIN cp2i_evaluations e ON t.id = e.texte_id
        WHERE t.user_id = ?
        ORDER BY t.id, e.created_at
    ");
    
    $stmt->execute([$userId]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Organiser les données par texte
    $textes = [];
    
    foreach ($results as $row) {
        $texteId = $row['texte_id'];
        
        // Initialiser le texte s'il n'existe pas encore
        if (!isset($textes[$texteId])) {
            $textes[$texteId] = [
                'id' => $texteId,
                'titre' => $row['titre'],
                'statut' => $row['statut'],
                'corrections' => []
            ];
        }
        
        // Ajouter l'évaluation si elle existe
        if ($row['evaluation_id'] && $row['note_totale'] !== null) {
            $textes[$texteId]['corrections'][] = [
                'evaluation_id' => $row['evaluation_id'],
                'correcteur_id' => $row['correcteur_id'],
                'note_totale' => floatval($row['note_totale']),
                'note_pertinence' => intval($row['pertinence']),
                'note_coherence' => intval($row['coherence']),
                'note_correction' => intval($row['correction']),
                'note_presentation' => intval($row['presentation']),
                'commentaires' => $row['remarques'],
                'date_evaluation' => $row['evaluation_date']
            ];
        }
    }
    
    // Convertir en tableau indexé
    $textesArray = array_values($textes);
    
    // Réponse
    $response = [
        'success' => true,
        'user_id' => $userId,
        'textes' => $textesArray,
        'total_textes' => count($textesArray),
        'debug_info' => [
            'raw_results_count' => count($results),
            'processed_textes_count' => count($textesArray)
        ]
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => basename(__FILE__)
    ]);
}
?>