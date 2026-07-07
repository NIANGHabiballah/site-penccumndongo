<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

try {
    $pdo = getDB();
    
    // Récupérer directement les évaluations pour le texte ID 69
    $stmt = $pdo->prepare("
        SELECT 
            t.id,
            t.titre,
            t.statut,
            e.pertinence,
            e.coherence,
            e.correction,
            e.presentation,
            e.note_totale,
            e.remarques,
            e.created_at
        FROM cp2i_textes t
        LEFT JOIN cp2i_evaluations e ON t.id = e.texte_id
        WHERE t.id = 69
        ORDER BY e.created_at
    ");
    
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $textes = [];
    foreach ($results as $row) {
        $texteId = $row['id'];
        
        if (!isset($textes[$texteId])) {
            $textes[$texteId] = [
                'id' => $row['id'],
                'titre' => $row['titre'],
                'statut' => $row['statut'],
                'corrections' => []
            ];
        }
        
        if ($row['note_totale']) {
            $textes[$texteId]['corrections'][] = [
                'note_totale' => $row['note_totale'],
                'note_pertinence' => $row['pertinence'],
                'note_coherence' => $row['coherence'],
                'note_correction' => $row['correction'],
                'note_presentation' => $row['presentation'],
                'commentaires' => $row['remarques'],
                'date_correction' => $row['created_at']
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'textes' => array_values($textes)
    ]);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>