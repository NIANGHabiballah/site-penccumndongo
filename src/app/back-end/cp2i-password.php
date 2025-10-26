<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $user = verifyToken();
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['current_password']) || !isset($data['new_password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Mot de passe actuel et nouveau requis']);
        exit;
    }
    
    changePassword($user, $data['current_password'], $data['new_password']);
}

function changePassword($user, $currentPassword, $newPassword) {
    $db = getDB();
    
    // Vérifier le mot de passe actuel
    $stmt = $db->prepare("SELECT password FROM cp2i_users WHERE id = ?");
    $stmt->execute([$user['id']]);
    $userRecord = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!password_verify($currentPassword, $userRecord['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Mot de passe actuel incorrect']);
        return;
    }
    
    // Mettre à jour le mot de passe
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $db->prepare("UPDATE cp2i_users SET password = ? WHERE id = ?");
    $result = $stmt->execute([$newHash, $user['id']]);
    
    if ($result) {
        // Enregistrer l'action dans l'historique
        logAction($user['id'], 'password_change', 'Changement de mot de passe');
        
        echo json_encode(['success' => true, 'message' => 'Mot de passe modifié avec succès']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de la modification']);
    }
}
?>