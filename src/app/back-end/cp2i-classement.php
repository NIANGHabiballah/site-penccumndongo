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
    
    // Récupérer toutes les notes moyennes des participants
    $stmt = $db->prepare("
        SELECT 
            t.user_id,
            u.nom, u.prenom,
            AVG(e.note_totale) as note_moyenne
        FROM cp2i_textes t
        JOIN cp2i_users u ON t.user_id = u.id  
        JOIN cp2i_evaluations e ON t.id = e.texte_id
        WHERE u.role = 'participant'
        GROUP BY t.user_id, u.nom, u.prenom
        HAVING note_moyenne IS NOT NULL
        ORDER BY note_moyenne DESC
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