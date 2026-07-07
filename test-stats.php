<?php
require_once 'src/app/back-end/config.php';

$db = getDB();

// Test direct des statistiques
$stmt = $db->prepare("SELECT COUNT(*) as total FROM cp2i_textes");
$stmt->execute();
$result = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Test direct base de données:\n";
echo "Total textes: " . $result['total'] . "\n";

$stmt = $db->prepare("SELECT COUNT(*) as en_attente FROM cp2i_textes WHERE statut = 'en_attente'");
$stmt->execute();
$result = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Textes en attente: " . $result['en_attente'] . "\n";

// Test de la requête complète
$stmt = $db->prepare("
    SELECT 
        COUNT(*) as total_textes,
        COUNT(CASE WHEN statut = 'accepte' THEN 1 END) as textes_acceptes,
        COUNT(CASE WHEN statut = 'refuse' THEN 1 END) as textes_refuses,
        COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as textes_en_attente
    FROM cp2i_textes
");
$stmt->execute();
$stats = $stmt->fetch(PDO::FETCH_ASSOC);

echo "\nRequête complète:\n";
print_r($stats);
?>