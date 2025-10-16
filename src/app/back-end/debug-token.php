<?php
require_once 'config.php';
setCorsHeaders();

try {
    $user = verifyToken();
    echo json_encode([
        'success' => true,
        'user' => $user,
        'role' => $user['role'] ?? 'undefined'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'error' => $e->getMessage(),
        'headers' => getallheaders()
    ]);
}
?>