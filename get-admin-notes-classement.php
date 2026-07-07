<?php
require_once 'config.php';
setCorsHeaders();

$db = getDB();

try {
    // Récupérer tous les participants avec leurs textes et évaluations détaillées
    $stmt = $db->prepare("
        SELECT DISTINCT
            u.id as user_id,
            u.nom,
            u.prenom,
            u.email,
            u.ville,
            t.id as texte_id,
            t.titre,
            t.langue,
            t.theme,
            t.created_at as date_soumission,
            t.statut
        FROM cp2i_users u
        LEFT JOIN cp2i_textes t ON u.id = t.user_id
        WHERE u.role = 'participant'
        ORDER BY u.nom, u.prenom
    ");
    
    $stmt->execute();
    $participants = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $result = [];
    
    foreach ($participants as $participant) {
        $userId = $participant['user_id'];
        
        // Initialiser le participant s'il n'existe pas encore
        if (!isset($result[$userId])) {
            $result[$userId] = [
                'user_id' => $userId,
                'nom' => $participant['nom'],
                'prenom' => $participant['prenom'],
                'email' => $participant['email'],
                'ville' => $participant['ville'],
                'textes' => [],
                'note_moyenne' => null,
                'total_textes' => 0
            ];
        }
        
        // Si le participant a un texte
        if ($participant['texte_id']) {
            $texteId = $participant['texte_id'];
            
            // Récupérer toutes les évaluations pour ce texte
            $evalStmt = $db->prepare("
                SELECT 
                    e.id,
                    e.correcteur_id,
                    e.pertinence,
                    e.coherence,
                    e.correction,
                    e.presentation,
                    e.note_totale,
                    e.remarques,
                    e.created_at,
                    c.nom as correcteur_nom,
                    c.prenom as correcteur_prenom
                FROM cp2i_evaluations e
                LEFT JOIN cp2i_users c ON e.correcteur_id = c.id
                WHERE e.texte_id = ?
                ORDER BY e.created_at ASC
            ");
            
            $evalStmt->execute([$texteId]);
            $evaluations = $evalStmt->fetchAll(PDO::FETCH_ASSOC);
            
            $texte = [
                'id' => $texteId,
                'titre' => $participant['titre'],
                'langue' => $participant['langue'],
                'theme' => $participant['theme'],
                'date_soumission' => $participant['date_soumission'],
                'statut' => $participant['statut'],
                'evaluations' => $evaluations,
                'note_moyenne_texte' => null
            ];
            
            // Calculer la note moyenne du texte
            if (!empty($evaluations)) {
                $totalNotes = 0;
                $nbEvaluations = 0;
                
                foreach ($evaluations as $eval) {
                    if ($eval['note_totale']) {
                        $totalNotes += $eval['note_totale'];
                        $nbEvaluations++;
                    }
                }
                
                if ($nbEvaluations > 0) {
                    $texte['note_moyenne_texte'] = $totalNotes / $nbEvaluations;
                }
            }
            
            $result[$userId]['textes'][] = $texte;
            $result[$userId]['total_textes']++;
        }
    }
    
    // Calculer la note moyenne globale pour chaque participant
    foreach ($result as &$participant) {
        if (!empty($participant['textes'])) {
            $totalNotes = 0;
            $nbTextes = 0;
            
            foreach ($participant['textes'] as $texte) {
                if ($texte['note_moyenne_texte']) {
                    $totalNotes += $texte['note_moyenne_texte'];
                    $nbTextes++;
                }
            }
            
            if ($nbTextes > 0) {
                $participant['note_moyenne'] = $totalNotes / $nbTextes;
            }
        }
    }
    
    // Convertir en array indexé et trier par note moyenne décroissante
    $finalResult = array_values($result);
    
    usort($finalResult, function($a, $b) {
        if ($a['note_moyenne'] === null && $b['note_moyenne'] === null) return 0;
        if ($a['note_moyenne'] === null) return 1;
        if ($b['note_moyenne'] === null) return -1;
        return $b['note_moyenne'] <=> $a['note_moyenne'];
    });
    
    echo json_encode([
        'success' => true,
        'participants' => $finalResult
    ]);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur lors de la récupération des données: ' . $e->getMessage()]);
}
?>