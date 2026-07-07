<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=u122559880_form_contact;charset=utf8',
        'u122559880_root',
        'Tafsir#27',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->query("SELECT module, COUNT(*) as inscrits FROM inscriptions_pencboost GROUP BY module");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $result = new stdClass();
    foreach ($rows as $row) {
        $key = $row['module'];
        $result->$key = (int)$row['inscrits'];
    }

    echo json_encode(['success' => true, 'data' => $result]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
