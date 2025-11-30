<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user = verifyToken();
    $action = $_GET['action'] ?? 'stats';
    
    if ($action === 'stats') {
        getSimpleStats($user);
    }
}

function getSimpleStats($user) {
    $db = getDB();
    
    if ($user['role'] === 'participant') {
        // Stats spécifiques au participant
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) as total_textes,
                SUM(CASE WHEN statut = 'accepte' THEN 1 ELSE 0 END) as textes_acceptes,
                SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END) as textes_refuses,
                SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as textes_en_attente,
                AVG(CASE WHEN note IS NOT NULL THEN note END) as note_moyenne
            FROM cp2i_textes 
            WHERE user_id = ?
        ");
        $stmt->execute([$user['user_id']]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Assurer des valeurs par défaut
        $stats['total_textes'] = (int)$stats['total_textes'];
        $stats['textes_acceptes'] = (int)$stats['textes_acceptes'];
        $stats['textes_refuses'] = (int)$stats['textes_refuses'];
        $stats['textes_en_attente'] = (int)$stats['textes_en_attente'];
        $stats['note_moyenne'] = $stats['note_moyenne'] ? (float)$stats['note_moyenne'] : null;
        
    } else {
        // Stats globales pour admin/correcteur
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) as total_textes,
                SUM(CASE WHEN statut = 'accepte' THEN 1 ELSE 0 END) as textes_acceptes,
                SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END) as textes_refuses,
                SUM(CASE WHEN statut IS NULL OR statut = '' OR statut = 'en_attente' THEN 1 ELSE 0 END) as textes_en_attente,
                AVG(CASE WHEN note IS NOT NULL AND note > 0 THEN note END) as note_moyenne,
                COUNT(CASE WHEN note IS NOT NULL AND note > 0 THEN 1 END) as textes_notes
            FROM cp2i_textes
        ");
        $stmt->execute();
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Textes avec affectations
        $stmt = $db->prepare("
            SELECT 
                t.id as texte_id,
                t.titre,
                t.statut,
                u.prenom as auteur_prenom,
                u.nom as auteur_nom,
                COUNT(a.corrector_id) as nb_correcteurs,
                COALESCE(GROUP_CONCAT(CONCAT(c.prenom, ' ', c.nom) SEPARATOR ', '), '') as correcteurs_noms
            FROM cp2i_textes t
            JOIN cp2i_users u ON t.user_id = u.id
            LEFT JOIN cp2i_affectations a ON t.id = a.texte_id
            LEFT JOIN cp2i_users c ON a.corrector_id = c.id
            GROUP BY t.id, t.titre, t.statut, u.prenom, u.nom
            ORDER BY t.created_at DESC
        ");
        $stmt->execute();
        $textes_affectations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Statistiques d'affectation globales
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) as total_affectations,
                COUNT(CASE WHEN EXISTS(
                    SELECT 1 FROM cp2i_evaluations e 
                    WHERE e.texte_id = a.texte_id AND e.correcteur_id = a.corrector_id
                ) THEN 1 END) as affectations_terminees,
                COUNT(CASE WHEN NOT EXISTS(
                    SELECT 1 FROM cp2i_evaluations e 
                    WHERE e.texte_id = a.texte_id AND e.correcteur_id = a.corrector_id
                ) THEN 1 END) as affectations_restantes
            FROM cp2i_affectations a
        ");
        $stmt->execute();
        $affectation_stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Statistiques des correcteurs - calcul correct
        $correcteurs_stats = [];
        $stmt = $db->prepare("SELECT id, prenom, nom, email FROM cp2i_users WHERE role = 'correcteur' ORDER BY nom");
        $stmt->execute();
        $correcteurs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($correcteurs as $correcteur) {
            // Textes assignés
            $stmt = $db->prepare("SELECT COUNT(*) FROM cp2i_affectations WHERE corrector_id = ?");
            $stmt->execute([$correcteur['id']]);
            $assignes = (int)$stmt->fetchColumn();
            
            // Textes évalués par ce correcteur sur SES textes assignés
            $stmt = $db->prepare("
                SELECT COUNT(*) 
                FROM cp2i_evaluations e
                INNER JOIN cp2i_affectations a ON e.texte_id = a.texte_id
                WHERE e.correcteur_id = ? AND a.corrector_id = ?
            ");
            $stmt->execute([$correcteur['id'], $correcteur['id']]);
            $corriges = (int)$stmt->fetchColumn();
            
            $correcteurs_stats[] = [
                'id' => $correcteur['id'],
                'prenom' => $correcteur['prenom'],
                'nom' => $correcteur['nom'],
                'textes_assignes' => $assignes,
                'textes_corriges' => $corriges,
                'textes_restants' => $assignes - $corriges
            ];
        }
        
        $stmt = $db->prepare("SELECT 1"); // Requête factice pour éviter l'erreur
        $stmt->execute();
        
        $stats['textes_affectations'] = $textes_affectations;
        $stats['affectation_stats'] = $affectation_stats;
        $stats['correcteurs_stats'] = $correcteurs_stats;
        
        // Ajouter les statistiques globales d'affectations
        $stats['total_affectations'] = (int)$affectation_stats['total_affectations'];
        $stats['affectations_terminees'] = (int)$affectation_stats['affectations_terminees'];
        $stats['affectations_restantes'] = (int)$affectation_stats['affectations_restantes'];
    }
    
    echo json_encode(['stats' => $stats]);
}
?>