<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config/database.php';

$searchTerm = $_GET['search'] ?? '';

if (empty($searchTerm)) {
    echo json_encode(['error' => 'Terme de recherche requis']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT id, nom, prenom, email, role, date_creation 
        FROM users 
        WHERE CONCAT(nom, ' ', prenom) LIKE ? 
        OR nom LIKE ? 
        OR prenom LIKE ? 
        OR email LIKE ?
        ORDER BY nom, prenom
    ");
    
    $searchPattern = '%' . $searchTerm . '%';
    $stmt->execute([$searchPattern, $searchPattern, $searchPattern, $searchPattern]);
    
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'users' => $users,
        'count' => count($users)
    ]);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>