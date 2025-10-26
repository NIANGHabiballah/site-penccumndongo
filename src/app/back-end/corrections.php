<?php
require_once 'config.php';
setCorsHeaders();

$user = verifyToken();
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

if ($user['role'] !== 'correcteur' && $user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

switch ($method) {
    case 'POST':
        corrigerTexte($user, $data);
        break;
    case 'GET':
        getCorrections($user);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Méthode non autorisée']);
}

function corrigerTexte($user, $data) {
    $pdo = getDB();
    
    $texte_id = (int)$data['texte_id'];
    $note = (float)$data['note'];
    $commentaires = htmlspecialchars($data['commentaires']);
    $criteres = json_encode($data['criteres'] ?? []);
    
    try {
        $pdo->beginTransaction();
        
        // Insertion correction
        $stmt = $pdo->prepare("INSERT INTO corrections (texte_id, correcteur_id, note, commentaires, criteres) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$texte_id, $user['userId'], $note, $commentaires, $criteres]);
        
        // Mise à jour statut texte
        $stmt = $pdo->prepare("UPDATE textes SET statut = 'corrige', note_finale = ? WHERE id = ?");
        $stmt->execute([$note, $texte_id]);
        
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Correction enregistrée']);
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['error' => 'Erreur lors de la correction']);
    }
}

function getCorrections($user) {
    $pdo = getDB();
    
    $stmt = $pdo->prepare("
        SELECT c.*, t.titre, u.nom, u.prenom 
        FROM corrections c 
        JOIN textes t ON c.texte_id = t.id 
        JOIN users u ON t.participant_id = u.id 
        WHERE c.correcteur_id = ? 
        ORDER BY c.date_correction DESC
    ");
    $stmt->execute([$user['userId']]);
    
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}
?>