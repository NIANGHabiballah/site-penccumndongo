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
        case 'users':
            if ($user['role'] === 'admin') {
                getUsers();
            } else {
                http_response_code(403);
                echo json_encode(['error' => 'Accès refusé']);
            }
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
        // Stats pour correcteur/admin
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) as total_textes,
                SUM(CASE WHEN statut = 'accepte' THEN 1 ELSE 0 END) as textes_acceptes,
                SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END) as textes_refuses,
                SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as textes_en_attente,
                AVG(CASE WHEN note IS NOT NULL THEN note ELSE NULL END) as note_moyenne
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
        
        // Comptes utilisateurs
        $stmt = $db->prepare("
            SELECT 
                COUNT(CASE WHEN role = 'participant' THEN 1 END) as total_participants,
                COUNT(CASE WHEN role = 'correcteur' THEN 1 END) as total_correcteurs,
                COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins
            FROM cp2i_users
        ");
        $stmt->execute();
        $users_stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Activité récente
        $stmt = $db->prepare("
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM cp2i_textes 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        ");
        $stmt->execute();
        $activite_recente = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'stats' => $stats,
            'stats_langues' => $stats_langues,
            'users_stats' => $users_stats,
            'activite_recente' => $activite_recente
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

// Nouvelle fonction pour gérer les utilisateurs (admin seulement)
if ($method === 'POST' && isset($_GET['action'])) {
    $user = verifyToken();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }
    
    $action = $_GET['action'];
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'get_users':
            getUsers();
            break;
        case 'assign_corrector':
            assignCorrector($input);
            break;
    }
}

function getUsers() {
    $db = getDB();
    
    // Récupérer tous les utilisateurs avec leurs stats
    $stmt = $db->prepare("
        SELECT u.id, u.email, u.nom, u.prenom, u.role, u.created_at,
               COUNT(t.id) as nb_textes,
               AVG(t.note) as note_moyenne
        FROM cp2i_users u
        LEFT JOIN cp2i_textes t ON u.id = t.user_id
        GROUP BY u.id
        ORDER BY u.role, u.created_at DESC
    ");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Récupérer les affectations existantes
    $stmt = $db->prepare("
        SELECT a.participant_id, a.corrector_id,
               p.nom as participant_nom, p.prenom as participant_prenom,
               c.nom as corrector_nom, c.prenom as corrector_prenom
        FROM cp2i_affectations a
        JOIN cp2i_users p ON a.participant_id = p.id
        JOIN cp2i_users c ON a.corrector_id = c.id
    ");
    $stmt->execute();
    $affectations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'users' => $users,
        'affectations' => $affectations
    ]);
}

function assignCorrector($data) {
    $db = getDB();
    
    $participant_id = $data['participant_id'] ?? 0;
    $corrector_id = $data['corrector_id'] ?? 0;
    
    if (!$participant_id || !$corrector_id) {
        http_response_code(400);
        echo json_encode(['error' => 'IDs participant et correcteur requis']);
        return;
    }
    
    try {
        $stmt = $db->prepare("INSERT INTO cp2i_affectations (participant_id, corrector_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE corrector_id = VALUES(corrector_id)");
        $stmt->execute([$participant_id, $corrector_id]);
        
        echo json_encode(['success' => true, 'message' => 'Affectation réalisée avec succès']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de l\'affectation']);
    }
}
?>