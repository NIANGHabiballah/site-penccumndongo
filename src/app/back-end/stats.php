<?php
require_once 'config.php';
setCorsHeaders();

$user = verifyToken();

if ($user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

$pdo = getDB();

try {
    // Statistiques générales
    $stats = [];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE role = 'participant'");
    $stats['participants'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE role = 'correcteur'");
    $stats['correcteurs'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM textes");
    $stats['textes'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM corrections");
    $stats['corrections'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Textes par statut
    $stmt = $pdo->query("SELECT statut, COUNT(*) as count FROM textes GROUP BY statut");
    $stats['textes_par_statut'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Dernières activités
    $stmt = $pdo->query("
        SELECT 'soumission' as type, t.titre as titre, u.nom, u.prenom, t.date_soumission as date 
        FROM textes t 
        JOIN users u ON t.participant_id = u.id 
        ORDER BY t.date_soumission DESC 
        LIMIT 10
    ");
    $stats['dernieres_activites'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($stats);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erreur lors de la récupération des statistiques']);
}
?>