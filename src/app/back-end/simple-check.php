<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $host = 'localhost';
    $dbname = 'u122559880_form_contact';
    $username = 'u122559880_root';
    $password = 'Tafsir#27';
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    
    // Compter les textes par titre
    $stmt = $pdo->query("SELECT titre, COUNT(*) as count FROM cp2i_textes GROUP BY titre");
    $texts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['texts' => $texts]);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>