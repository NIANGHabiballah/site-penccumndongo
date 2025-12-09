<?php
// API spécifique pour Mouhamadou (user_id à déterminer)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once 'config.php';

try {
    $pdo = getDB();
    
    // Trouver l'ID de Mouhamadou
    $stmt = $pdo->prepare("SELECT id FROM cp2i_users WHERE prenom = 'Mouhamadou' AND nom LIKE '%Diop%' LIMIT 1");
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode(['error' => 'Utilisateur Mouhamadou non trouvé']);
        exit;
    }
    
    $userId = $user['id'];
    
    // Récupérer ses évaluations
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
        'user_id' => $userId,
        'textes' => array_values($textes)
    ]);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>