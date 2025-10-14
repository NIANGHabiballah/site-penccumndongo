<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user = verifyToken();
    $action = $_GET['action'] ?? 'stats';
    
    switch ($action) {
        case 'stats':
            getStats($user);
            break;
        case 'profile':
            getProfile($user);
            break;
    }
}

function getStats($user) {
    $db = getDB();
    
    if ($user['role'] === 'participant') {
        // Stats pour participant
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) as total_textes,
                SUM(CASE WHEN statut = 'accepte' THEN 1 ELSE 0 END) as textes_acceptes,
                SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END) as textes_refuses,
                SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as textes_en_attente,
                AVG(CASE WHEN note IS NOT NULL THEN note ELSE NULL END) as note_moyenne
            FROM cp2i_textes 
            WHERE user_id = ?
        ");
        $stmt->execute([$user['user_id']]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Derniers textes
        $stmt = $db->prepare("SELECT titre, statut, note, created_at FROM cp2i_textes WHERE user_id = ? ORDER BY created_at DESC LIMIT 5");
        $stmt->execute([$user['user_id']]);
        $derniers_textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'stats' => $stats,
            'derniers_textes' => $derniers_textes
        ]);
        
    } else {
        // Stats pour correcteur
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) as total_textes,
                SUM(CASE WHEN statut = 'accepte' THEN 1 ELSE 0 END) as textes_acceptes,
                SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END) as textes_refuses,
                SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as textes_en_attente
            FROM cp2i_textes
        ");
        $stmt->execute();
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Stats par langue
        $stmt = $db->prepare("
            SELECT langue, COUNT(*) as count 
            FROM cp2i_textes 
            GROUP BY langue
        ");
        $stmt->execute();
        $stats_langues = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Nombre de participants
        $stmt = $db->prepare("SELECT COUNT(*) as total_participants FROM cp2i_users WHERE role = 'participant'");
        $stmt->execute();
        $participants = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'stats' => $stats,
            'stats_langues' => $stats_langues,
            'total_participants' => $participants['total_participants']
        ]);
    }
}

function getProfile($user) {
    $db = getDB();
    
    $stmt = $db->prepare("SELECT id, email, nom, prenom, telephone, role, created_at FROM cp2i_users WHERE id = ?");
    $stmt->execute([$user['user_id']]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode(['profile' => $profile]);
}
?>