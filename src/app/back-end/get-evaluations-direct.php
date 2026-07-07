<?php
require_once 'config.php';
setCorsHeaders();

// Assurer que seul du JSON est retourné
header('Content-Type: application/json');
ob_clean();

try {
    $payload = verifyToken();
    $userId = $payload['userId'];
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Token invalide']);
    exit;
}

try {
    $pdo = getDB();
    
    $stmt = $pdo->prepare("
        SELECT 
            t.id as texte_id,
            t.titre,
            t.statut,
            e.pertinence,
            e.coherence,
            e.correction,
            e.presentation,
            e.note_totale,
            e.remarques
        FROM cp2i_textes t
        LEFT JOIN cp2i_evaluations e ON t.id = e.texte_id
        WHERE t.user_id = ?
        ORDER BY t.id, e.created_at
    ");
    
    $stmt->execute([$userId]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $textes = [];
    foreach ($results as $row) {
        $texteId = $row['texte_id'];
        
        if (!isset($textes[$texteId])) {
            $textes[$texteId] = [
                'id' => $texteId,
                'titre' => $row['titre'],
                'statut' => $row['statut'],
                'corrections' => []
            ];
        }
        
        if ($row['note_totale']) {
            $textes[$texteId]['corrections'][] = [
                'note_totale' => floatval($row['note_totale']),
                'note_pertinence' => intval($row['pertinence']),
                'note_coherence' => intval($row['coherence']),
                'note_correction' => intval($row['correction']),
                'note_presentation' => intval($row['presentation']),
                'commentaires' => $row['remarques']
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'textes' => array_values($textes)
    ]);
    
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode(['error' => $e->getMessage()]);
}
?>