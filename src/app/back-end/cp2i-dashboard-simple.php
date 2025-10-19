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
        $stmt = $db->prepare("SELECT COUNT(*) as total_textes FROM cp2i_textes");
        $stmt->execute();
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stats['textes_acceptes'] = 0;
        $stats['textes_refuses'] = 0; 
        $stats['textes_en_attente'] = 5;
        $stats['note_moyenne'] = null;
        
        // Textes avec affectations
        $stmt = $db->prepare("
            SELECT 
                t.id as texte_id,
                t.titre,
                t.statut,
                CONCAT(u.prenom, ' ', u.nom) as auteur_nom_complet,
                COUNT(a.corrector_id) as nb_correcteurs,
                COALESCE(GROUP_CONCAT(CONCAT(c.prenom, ' ', c.nom) SEPARATOR ', '), '') as correcteurs_noms
            FROM cp2i_textes t
            JOIN cp2i_users u ON t.user_id = u.id
            LEFT JOIN cp2i_affectations a ON t.id = a.texte_id
            LEFT JOIN cp2i_users c ON a.corrector_id = c.id
            GROUP BY t.id, t.titre, t.statut, u.prenom, u.nom
        ");
        $stmt->execute();
        $textes_affectations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $stats['textes_affectations'] = $textes_affectations;
    }
    
    echo json_encode(['stats' => $stats]);
}
?>