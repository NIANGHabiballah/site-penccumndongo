<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

try {
    $db = getDB();
    
    // Récupérer tous les participants avec leurs textes et notes
    $stmt = $db->prepare("
        SELECT 
            u.id as user_id,
            u.nom, u.prenom,
            COUNT(e.id) as nb_evaluations,
            AVG(e.note_totale) as note_moyenne
        FROM cp2i_users u
        JOIN cp2i_textes t ON u.id = t.user_id
        JOIN cp2i_evaluations e ON t.id = e.texte_id
        WHERE u.role = 'participant'
        GROUP BY u.id, u.nom, u.prenom
        ORDER BY note_moyenne DESC, nb_evaluations DESC
    ");
    $stmt->execute();
    $participants = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'participants' => $participants
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>