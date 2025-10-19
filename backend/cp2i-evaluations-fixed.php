<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $user = verifyToken();
    if ($user['role'] !== 'admin' && $user['role'] !== 'correcteur') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }
    
    $action = $_GET['action'] ?? 'evaluate';
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($action === 'evaluate') {
        saveEvaluationFixed($user, $input);
    }
}

function saveEvaluationFixed($user, $data) {
    $db = getDB();
    
    $texte_id = $data['texte_id'] ?? 0;
    $pertinence = $data['pertinence'] ?? 0;
    $coherence = $data['coherence'] ?? 0;
    $correction = $data['correction'] ?? 0;
    $presentation = $data['presentation'] ?? 0;
    $note = $data['note'] ?? ($pertinence + $coherence + $correction + $presentation);
    $commentaire = $data['commentaire'] ?? '';
    $statut = $data['statut'] ?? 'en_attente';
    
    if (!$texte_id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID du texte requis']);
        return;
    }
    
    try {
        $db->beginTransaction();
        
        // 1. Mettre à jour cp2i_textes (comme avant)
        $stmt = $db->prepare("
            UPDATE cp2i_textes 
            SET note = ?, commentaire = ?, statut = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$note, $commentaire, $statut, $texte_id]);
        
        // 2. NOUVEAU: Sauvegarder dans cp2i_evaluations avec les notes par critère
        $stmt = $db->prepare("
            INSERT INTO cp2i_evaluations 
            (texte_id, correcteur_id, pertinence, coherence, correction, presentation, note_totale, remarques, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
            pertinence = VALUES(pertinence),
            coherence = VALUES(coherence),
            correction = VALUES(correction),
            presentation = VALUES(presentation),
            note_totale = VALUES(note_totale),
            remarques = VALUES(remarques),
            updated_at = NOW()
        ");
        $stmt->execute([$texte_id, $user['user_id'], $pertinence, $coherence, $correction, $presentation, $note, $commentaire]);
        
        // 3. Historique
        $stmt = $db->prepare("
            INSERT INTO cp2i_history (user_id, action, description) 
            VALUES (?, 'evaluation', ?)
        ");
        $description = "Évaluation détaillée - Texte ID $texte_id - P:$pertinence C:$coherence Cor:$correction Pr:$presentation - Total: $note/20";
        $stmt->execute([$user['user_id'], $description]);
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Évaluation sauvegardée avec notes par critère'
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        http_response_code(500);
        echo json_encode(['error' => 'Erreur: ' . $e->getMessage()]);
    }
}
?>