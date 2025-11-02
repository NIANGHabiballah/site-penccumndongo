<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Configuration base de données
define('DB_HOST', 'localhost');
define('DB_NAME', 'u122559880_form_contact');
define('DB_USER', 'u122559880_root');
define('DB_PASS', 'Tafsir#27');

echo json_encode([
    'config' => [
        'host' => DB_HOST,
        'database' => DB_NAME,
        'user' => DB_USER,
        'password_length' => strlen(DB_PASS)
    ]
]);

try {
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8';
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    
    // Test de la table cp2i_users
    $stmt = $pdo->prepare("SHOW TABLES LIKE 'cp2i_users'");
    $stmt->execute();
    $tableExists = $stmt->fetch() ? true : false;
    
    if ($tableExists) {
        $stmt = $pdo->prepare("DESCRIBE cp2i_users");
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Connexion réussie',
            'table_exists' => true,
            'columns' => $columns
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'Connexion réussie mais table cp2i_users introuvable',
            'table_exists' => false
        ]);
    }
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'code' => $e->getCode()
    ]);
}
?>