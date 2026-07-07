<?php
require_once 'config.php';
setCorsHeaders();

// Afficher les headers reçus
$headers = getallheaders();
echo json_encode([
    'headers_received' => $headers,
    'authorization_header' => $headers['Authorization'] ?? $headers['authorization'] ?? 'MISSING',
    'php_version' => phpversion(),
    'request_method' => $_SERVER['REQUEST_METHOD']
]);
?>