<?php
require_once 'config.php';
setCorsHeaders();

// Version debug sans authentification pour tester
$testUserId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 35;

try {
    $pdo = getDB();
    
    echo json_encode([
        'debug' => true,
        'message' => 'API Debug - Test utilisateur ID: ' . $testUserId,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
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
    
    $stmt->execute([$testUserId]);
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
        'debug' => true,
        'user_id' => $testUserId,
        'textes' => $textesArray,
        'total_textes' => count($textesArray),
        'raw_results' => $results,
        'debug_info' => [
            'raw_results_count' => count($results),
            'processed_textes_count' => count($textesArray),
            'query_executed' => true,
            'database_connected' => true
        ]
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'debug' => true,
        'error' => $e->getMessage(),
        'file' => basename(__FILE__),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
?>