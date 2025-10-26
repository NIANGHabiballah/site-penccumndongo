<?php
require_once 'config.php';
setCorsHeaders();

// Endpoint dédié pour les statistiques correcteur
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

$user = verifyToken();

if (!$user || $user['role'] !== 'correcteur') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

try {
    $db = getDB();
    $correcteurId = $user['user_id'];
    
    // Nombre total de textes assignés
    $stmt = $db->prepare("SELECT COUNT(*) FROM cp2i_affectations WHERE corrector_id = ?");
    $stmt->execute([$correcteurId]);
    $totalAssignes = (int)$stmt->fetchColumn();
    
    // Nombre de textes corrigés (avec évaluations)
    $stmt = $db->prepare("SELECT COUNT(DISTINCT texte_id) FROM cp2i_evaluations WHERE correcteur_id = ?");
    $stmt->execute([$correcteurId]);
    $corriges = (int)$stmt->fetchColumn();
    
    // Nombre à corriger
    $aCorreger = $totalAssignes - $corriges;
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'total_assignes' => $totalAssignes,
            'corriges' => $corriges,
            'a_corriger' => $aCorreger
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur']);
}
?>