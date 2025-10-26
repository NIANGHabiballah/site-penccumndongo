<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $action = $_GET['action'] ?? 'stats';
    
    if ($action === 'stats') {
        // Mode debug sans authentification
        if (isset($_GET['debug']) && $_GET['debug'] === 'true') {
            getSimpleStats(['role' => 'admin', 'user_id' => 1]);
        } else {
            $user = verifyToken();
            getSimpleStats($user);
        }
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
        // Stats globales pour admin/correcteur - DONNÉES RÉELLES
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
        
        // Textes avec affectations - DONNÉES RÉELLES (d'abord récupérer les données)
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
        
        // FORCER le recalcul des statistiques depuis les vraies données
        $stats['total_textes'] = count($textes_affectations);
        $stats['textes_acceptes'] = 0;
        $stats['textes_refuses'] = 0;
        $stats['textes_en_attente'] = 0;
        
        foreach ($textes_affectations as $texte) {
            if ($texte['statut'] === 'accepte') {
                $stats['textes_acceptes']++;
            } elseif ($texte['statut'] === 'refuse') {
                $stats['textes_refuses']++;
            } else {
                $stats['textes_en_attente']++;
            }
        }
        
        // Statistiques d'affectation
        $stmt = $db->prepare("
            SELECT 
                COUNT(DISTINCT t.id) as total_textes,
                COUNT(DISTINCT CASE WHEN a.corrector_id IS NOT NULL THEN t.id END) as participants_affectes,
                COUNT(DISTINCT CASE WHEN a.corrector_id IS NULL THEN t.id END) as participants_non_affectes
            FROM cp2i_textes t
            LEFT JOIN cp2i_affectations a ON t.id = a.texte_id
        ");
        $stmt->execute();
        $affectation_stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Statistiques des correcteurs
        $stmt = $db->prepare("
            SELECT 
                c.id,
                c.prenom,
                c.nom,
                COUNT(a.texte_id) as textes_assignes,
                COUNT(CASE WHEN t.statut IN ('accepte', 'refuse') THEN 1 END) as textes_corriges,
                COUNT(CASE WHEN t.statut = 'en_attente' THEN 1 END) as textes_restants
            FROM cp2i_users c
            LEFT JOIN cp2i_affectations a ON c.id = a.corrector_id
            LEFT JOIN cp2i_textes t ON a.texte_id = t.id
            WHERE c.role = 'correcteur'
            GROUP BY c.id, c.prenom, c.nom
            ORDER BY textes_assignes DESC
        ");
        $stmt->execute();
        $correcteurs_stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $stats['textes_affectations'] = $textes_affectations;
        $stats['affectation_stats'] = $affectation_stats;
        $stats['correcteurs_stats'] = $correcteurs_stats;
    }
    
    echo json_encode(['stats' => $stats]);
}
?>