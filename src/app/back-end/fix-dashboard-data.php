<?php
require_once 'config.php';
setCorsHeaders();

$payload = verifyToken();

try {
    $pdo = getDB();
    
    // Nettoyer les doublons de textes
    $stmt = $pdo->prepare("
        DELETE t1 FROM cp2i_textes t1
        INNER JOIN cp2i_textes t2 
        WHERE t1.id > t2.id 
        AND t1.participant_id = t2.participant_id 
        AND t1.titre = t2.titre
    ");
    $stmt->execute();
    $duplicates = $stmt->rowCount();
    
    // Récupérer les textes nettoyés
    $stmt = $pdo->prepare("
        SELECT * FROM cp2i_textes 
        WHERE participant_id = ? 
        ORDER BY created_at DESC
    ");
    $stmt->execute([$payload['userId']]);
    $textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculer les stats
    $stats = [
        'total_textes' => count($textes),
        'textes_acceptes' => count(array_filter($textes, fn($t) => $t['statut'] === 'accepte')),
        'textes_refuses' => count(array_filter($textes, fn($t) => $t['statut'] === 'refuse')),
        'note_moyenne' => count($textes) > 0 ? array_sum(array_column($textes, 'note')) / count($textes) : 0
    ];
    
    echo json_encode([
        'success' => true,
        'textes' => $textes,
        'stats' => $stats,
        'corrections_applied' => [
            'duplicates_removed' => $duplicates
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>