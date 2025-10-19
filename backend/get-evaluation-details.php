<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once 'config/database.php';

$texteId = $_GET['texte_id'] ?? null;

if (!$texteId) {
    echo json_encode(['error' => 'ID du texte requis']);
    exit;
}

try {
    // Vérifier dans la table corrections
    $stmt = $pdo->prepare("
        SELECT 
            c.*,
            u.nom as correcteur_nom,
            u.prenom as correcteur_prenom
        FROM corrections c
        LEFT JOIN users u ON c.correcteur_id = u.id
        WHERE c.texte_id = ?
    ");
    $stmt->execute([$texteId]);
    $corrections = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Si pas de corrections, vérifier dans textes directement
    if (empty($corrections)) {
        $stmt = $pdo->prepare("
            SELECT 
                note,
                commentaire,
                statut
            FROM textes 
            WHERE id = ?
        ");
        $stmt->execute([$texteId]);
        $texte = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($texte && $texte['note']) {
            // Calculer les critères basés sur la note totale
            $noteParCritere = round($texte['note'] / 4, 1);
            $corrections = [[
                'note' => $texte['note'],
                'commentaire' => $texte['commentaire'],
                'criteres' => [
                    'pertinence' => $noteParCritere,
                    'coherence' => $noteParCritere,
                    'correction' => $noteParCritere,
                    'presentation' => $noteParCritere
                ],
                'correcteur_nom' => 'Correcteur',
                'correcteur_prenom' => '',
                'date_correction' => date('Y-m-d H:i:s')
            ]];
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