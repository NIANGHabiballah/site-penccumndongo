<?php
require_once 'config.php';
setContentType('application/json');

try {
    $db = getDB();
    
    $stmt = $db->query("SELECT id, email, nom, prenom, role FROM cp2i_users LIMIT 5");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'count' => count($users),
        'users' => $users
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>