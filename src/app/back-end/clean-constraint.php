<?php
require_once 'config.php';

$db = getDB();

try {
    $db->exec("ALTER TABLE cp2i_affectations DROP INDEX unique_affectation");
    echo "✓ Contrainte redondante 'unique_affectation' supprimée\n";
} catch (PDOException $e) {
    echo "ℹ️ Contrainte 'unique_affectation' déjà supprimée\n";
}

$stmt = $db->query("SHOW CREATE TABLE cp2i_affectations");
$result = $stmt->fetch(PDO::FETCH_ASSOC);
echo "\nStructure finale:\n" . $result['Create Table'] . "\n";
?>