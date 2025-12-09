<?php
require_once 'config.php';
setCorsHeaders();

try {
    $payload = verifyToken();
    $userId = $payload['userId'];
} catch (Exception $e) {
    echo json_encode(['error' => 'Token invalide']);
    exit;
}

try {
    $pdo = getDB();
    
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
            e.created_at,
            u.nom as correcteur_nom,
            u.prenom as correcteur_prenom
        FROM cp2i_textes t
        LEFT JOIN cp2i_evaluations e ON t.id = e.texte_id
        LEFT JOIN cp2i_users u ON e.correcteur_id = u.id
        WHERE t.participant_id = ?
        ORDER BY t.id, e.created_at
    ");
    
    $stmt->execute([$userId]);
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
                'date_correction' => $row['created_at'],
                'correcteur_nom' => $row['correcteur_nom'],
                'correcteur_prenom' => $row['correcteur_prenom']
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