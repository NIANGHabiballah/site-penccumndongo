<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config/database.php';

try {
    // Test connexion DB
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Vérifier si la table existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'formation_inscriptions'");
    $tableExists = $stmt->rowCount() > 0;
    
    // Vérifier la structure de la table si elle existe
    $columns = [];
    if ($tableExists) {
        $stmt = $pdo->query("DESCRIBE formation_inscriptions");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
    
    echo json_encode([
        'db_connection' => 'OK',
        'table_exists' => $tableExists,
        'columns' => $columns,
        'mail_function' => function_exists('mail') ? 'OK' : 'NOK'
    ]);
    
} catch(Exception $e) {
    echo json_encode([
        'error' => $e->getMessage(),
        'db_connection' => 'FAILED'
    ]);
}
?>