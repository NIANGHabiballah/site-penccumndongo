<?php
require_once 'config.php';
setCorsHeaders();

$user = verifyToken();
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

switch ($method) {
    case 'GET':
        getMessages($user);
        break;
    case 'POST':
        envoyerMessage($user, $data);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Méthode non autorisée']);
}

function getMessages($user) {
    $pdo = getDB();
    
    $stmt = $pdo->prepare("
        SELECT m.*, u.nom, u.prenom 
        FROM messages m 
        JOIN users u ON m.expediteur_id = u.id 
        WHERE m.destinataire_id = ? OR m.destinataire_id IS NULL 
        ORDER BY m.date_envoi DESC
    ");
    $stmt->execute([$user['userId']]);
    
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

function envoyerMessage($user, $data) {
    $pdo = getDB();
    
    $destinataire_id = $data['destinataire_id'] ?? null;
    $type = htmlspecialchars($data['type']);
    $sujet = htmlspecialchars($data['sujet'] ?? '');
    $contenu = htmlspecialchars($data['contenu']);
    
    try {
        $stmt = $pdo->prepare("INSERT INTO messages (expediteur_id, destinataire_id, type, sujet, contenu) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$user['userId'], $destinataire_id, $type, $sujet, $contenu]);
        
        echo json_encode(['success' => true, 'message' => 'Message envoyé']);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Erreur lors de l\'envoi']);
    }
}
?>