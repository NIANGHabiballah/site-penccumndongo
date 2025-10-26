<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once 'config/database.php';

$texteId = $_GET['texte_id'] ?? null;

if (!$texteId) {
    echo json_encode(['error' => 'ID du texte requis']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            c.id,
            c.note,
            c.commentaires,
            c.criteres,
            c.date_correction,
            u.nom as correcteur_nom,
            u.prenom as correcteur_prenom
        FROM corrections c
        JOIN users u ON c.correcteur_id = u.id
        WHERE c.texte_id = ?
        ORDER BY c.date_correction ASC
    ");
    
    $stmt->execute([$texteId]);
    $corrections = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Décoder les critères JSON
    foreach ($corrections as &$correction) {
        if ($correction['criteres']) {
            $correction['criteres'] = json_decode($correction['criteres'], true);
        }
    }
    
    echo json_encode([
        'success' => true,
        'corrections' => $corrections
    ]);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>