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
    
    // Stats de base
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
    
    echo json_encode([
        'stats' => array_merge($stats, [
            'textes_affectations' => $textes_affectations
        ])
    ]);
}
?>