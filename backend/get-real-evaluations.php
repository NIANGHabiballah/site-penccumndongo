<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once 'config/database.php';

$texteId = $_GET['texte_id'] ?? null;

if (!$texteId) {
    echo json_encode(['error' => 'ID du texte requis']);
    exit;
}

try {
    // D'abord chercher dans cp2i_evaluations pour les vraies notes par critère
    $stmt = $pdo->prepare("
        SELECT 
            e.*,
            u.nom as correcteur_nom,
            u.prenom as correcteur_prenom
        FROM cp2i_evaluations e
        LEFT JOIN cp2i_users u ON e.correcteur_id = u.id
        WHERE e.texte_id = ?
    ");
    $stmt->execute([$texteId]);
    $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Utiliser SEULEMENT les vraies données de cp2i_evaluations
    $corrections = [];
    foreach ($evaluations as $eval) {
        $corrections[] = [
            'id' => $eval['id'],
            'texte_id' => $eval['texte_id'],
            'note' => $eval['note_totale'],
            'commentaire' => $eval['remarques'],
            'correcteur_nom' => $eval['correcteur_nom'] ?: 'Correcteur',
            'correcteur_prenom' => $eval['correcteur_prenom'] ?: '',
            'criteres' => [
                'pertinence' => $eval['pertinence'],
                'coherence' => $eval['coherence'],
                'correction' => $eval['correction'],
                'presentation' => $eval['presentation']
            ]
        ];
    }
    
    echo json_encode([
        'success' => true,
        'corrections' => $corrections
    ]);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>