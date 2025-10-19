<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config/database.php';

$texteId = $_GET['texte_id'] ?? null;

if (!$texteId) {
    echo json_encode(['error' => 'ID du texte requis']);
    exit;
}

try {
    
    // Vérifier d'abord cp2i_evaluations
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
    $corrections = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Si pas de résultats, vérifier cp2i_corrections
    if (empty($corrections)) {
        $stmt = $pdo->prepare("
            SELECT 
                c.*,
                u.nom as correcteur_nom,
                u.prenom as correcteur_prenom
            FROM cp2i_corrections c
            LEFT JOIN cp2i_users u ON c.corrector_id = u.id
            WHERE c.texte_id = ?
        ");
        $stmt->execute([$texteId]);
        $corrections = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    foreach ($corrections as &$correction) {
        // Adapter selon la table (evaluations ou corrections)
        $note = $correction['note_totale'] ?? $correction['note'] ?? 0;
        $correction['note'] = $note;
        
        $correction['criteres'] = [
            'pertinence' => $correction['note_pertinence'] ?? $correction['pertinence'] ?? null,
            'coherence' => $correction['note_coherence'] ?? $correction['coherence'] ?? null,
            'correction' => $correction['note_correction'] ?? $correction['correction_langue'] ?? null,
            'presentation' => $correction['note_presentation'] ?? $correction['presentation'] ?? null
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