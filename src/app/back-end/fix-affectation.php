<?php
require_once 'config.php';

function assignCorrector($data) {
    $db = getDB();
    
    $texte_id = $data['texte_id'] ?? 0;
    $corrector_id = $data['corrector_id'] ?? 0;
    
    if (!$texte_id || !$corrector_id) {
        http_response_code(400);
        echo json_encode(['error' => 'IDs texte et correcteur requis']);
        return;
    }
    
    try {
        // Trouver le participant_id à partir du texte_id
        $stmt = $db->prepare("SELECT user_id FROM cp2i_textes WHERE id = ?");
        $stmt->execute([$texte_id]);
        $texte = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$texte) {
            http_response_code(404);
            echo json_encode(['error' => 'Texte non trouvé']);
            return;
        }
        
        $participant_id = $texte['user_id'];
        
        // Vérifier le nombre de correcteurs déjà affectés à ce participant
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM cp2i_affectations WHERE participant_id = ?");
        $stmt->execute([$participant_id]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        if ($count >= 3) {
            http_response_code(400);
            echo json_encode(['error' => 'Maximum 3 correcteurs par participant atteint']);
            return;
        }
        
        // Vérifier si ce correcteur est déjà affecté à ce participant
        $stmt = $db->prepare("SELECT id FROM cp2i_affectations WHERE participant_id = ? AND corrector_id = ?");
        $stmt->execute([$participant_id, $corrector_id]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            http_response_code(400);
            echo json_encode(['error' => 'Ce correcteur est déjà affecté à ce participant']);
            return;
        }
        
        // Créer la nouvelle affectation
        $stmt = $db->prepare("INSERT INTO cp2i_affectations (participant_id, corrector_id) VALUES (?, ?)");
        $stmt->execute([$participant_id, $corrector_id]);
        
        echo json_encode(['success' => true, 'message' => 'Correcteur affecté avec succès']);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de l\'affectation: ' . $e->getMessage()]);
    }
}

// Test de la fonction
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    assignCorrector($input);
}
?>