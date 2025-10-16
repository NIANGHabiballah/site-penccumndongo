<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user = verifyToken();
    
    // Vérifier que l'utilisateur est admin
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }
    
    // Mettre à jour les mots de passe si nécessaire
    updateAdminPasswords();
    
    getAllAccountsWithPasswords();
}

function updateAdminPasswords() {
    $db = getDB();
    
    $passwords = [
        'test@admin.com' => 'testadmin2024',
        'pencc.penccumndongo@gmail.com' => '1234'
    ];
    
    foreach ($passwords as $email => $password) {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare("UPDATE cp2i_users SET password = ? WHERE email = ?");
        $stmt->execute([$hash, $email]);
    }
}

function getAllAccountsWithPasswords() {
    $db = getDB();
    
    // Récupérer tous les comptes avec leurs informations
    $stmt = $db->prepare("
        SELECT id, email, nom, prenom, role, email_verified, created_at,
               CASE 
                   WHEN role = 'participant' THEN NULL
                   WHEN email = 'test@admin.com' THEN 'testadmin2024'
                   WHEN email = 'pencc.penccumndongo@gmail.com' THEN '1234'
                   WHEN password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' THEN 'password'
                   WHEN password = '$2y$10$4P56VHAG/mSbMozuZLWXgu6hPvtN4DNRFkJXwsyaaZYU3GXXoPxS6' THEN 'password123'
                   WHEN password = '$2y$10$xuMBH5ZHL0l2G95op1MaEOoUiDZZfL2RrJ0YkE0GYs8dVr3u7obmy' THEN '1234'
                   WHEN password = '$2y$10$Tqed9uOMs2iZufAX4oYH5OM.546xEfSWG.66.E7uOn8frsrmyPQ3e' THEN 'admin'
                   ELSE 'Mot de passe personnalisé'
               END as mot_de_passe_clair
        FROM cp2i_users 
        ORDER BY role, created_at DESC
    ");
    $stmt->execute();
    $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'accounts' => $accounts,
        'total' => count($accounts)
    ]);
}
?>