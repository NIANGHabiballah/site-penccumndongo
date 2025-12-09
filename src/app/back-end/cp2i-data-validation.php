<?php
require_once 'config.php';
setCorsHeaders();

$payload = verifyToken();
$action = $_GET['action'] ?? '';

try {
    $pdo = getDB();
    
    switch ($action) {
        case 'validate':
            // Validation des données utilisateur
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM cp2i_textes WHERE participant_id = ?");
            $stmt->execute([$payload['userId']]);
            $count = $stmt->fetchColumn();
            
            echo json_encode([
                'success' => true,
                'valid' => true,
                'textes_count' => $count
            ]);
            break;
            
        case 'clean':
            // Nettoyage des données incohérentes (admin seulement)
            if ($payload['role'] !== 'admin') {
                throw new Exception('Accès non autorisé');
            }
            
            // Supprimer les doublons
            $stmt = $pdo->query("
                DELETE t1 FROM cp2i_textes t1
                INNER JOIN cp2i_textes t2 
                WHERE t1.id > t2.id 
                AND t1.participant_id = t2.participant_id 
                AND t1.titre = t2.titre
            ");
            $duplicates = $stmt->rowCount();
            
            echo json_encode([
                'success' => true,
                'duplicates_removed' => $duplicates
            ]);
            break;
            
        default:
            throw new Exception('Action non reconnue');
    }
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>