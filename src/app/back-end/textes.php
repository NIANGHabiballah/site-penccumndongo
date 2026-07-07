<?php
require_once 'config.php';
setCorsHeaders();

$user = verifyToken();
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

switch ($method) {
    case 'GET':
        getTextes($user);
        break;
    case 'POST':
        soumettreTexte($user, $data);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Méthode non autorisée']);
}

function getTextes($user) {
    $pdo = getDB();
    
    if ($user['role'] === 'participant') {
        $stmt = $pdo->prepare("
            SELECT t.*, c.note, c.commentaires 
            FROM textes t 
            LEFT JOIN corrections c ON t.id = c.texte_id 
            WHERE t.participant_id = ? 
            ORDER BY t.date_soumission DESC
        ");
        $stmt->execute([$user['userId']]);
    } else {
        $stmt = $pdo->prepare("
            SELECT t.*, u.nom, u.prenom, c.note, c.commentaires 
            FROM textes t 
            JOIN users u ON t.participant_id = u.id 
            LEFT JOIN corrections c ON t.id = c.texte_id 
            ORDER BY t.date_soumission DESC
        ");
        $stmt->execute();
    }
    
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

function soumettreTexte($user, $data) {
    if ($user['role'] !== 'participant') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        return;
    }
    
    $pdo = getDB();
    
    $titre = htmlspecialchars($data['titre']);
    $contenu = htmlspecialchars($data['contenu']);
    $theme = htmlspecialchars($data['theme'] ?? '');
    
    try {
        $stmt = $pdo->prepare("INSERT INTO textes (participant_id, titre, contenu, theme) VALUES (?, ?, ?, ?)");
        $stmt->execute([$user['userId'], $titre, $contenu, $theme]);
        
        echo json_encode(['success' => true, 'message' => 'Texte soumis avec succès']);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Erreur lors de la soumission']);
    }
}
?>