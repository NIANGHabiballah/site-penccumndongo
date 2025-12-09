<?php
require_once 'config.php';
setCorsHeaders();

$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    $pdo = getDB();
    
    switch ($action) {
        case 'check':
            $text = $_POST['text'] ?? '';
            if (!$text) {
                throw new Exception('Texte requis');
            }
            
            // Vérification simple de plagiat
            $stmt = $pdo->prepare("
                SELECT id, titre, similarity_score 
                FROM reference_texts 
                WHERE MATCH(content) AGAINST(? IN NATURAL LANGUAGE MODE)
                LIMIT 5
            ");
            $stmt->execute([$text]);
            $matches = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'authenticity_score' => count($matches) > 0 ? 70 : 95,
                'matches' => $matches
            ]);
            break;
            
        default:
            throw new Exception('Action non reconnue');
    }
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>