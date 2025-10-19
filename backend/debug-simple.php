<?php
header('Content-Type: text/plain');

$host = 'localhost';
$dbname = 'u122559880_form_contact';
$username = 'u122559880_form_contact';
$password = 'votre_mot_de_passe'; // Remplacez par le vrai mot de passe

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    
    echo "=== STRUCTURE DE cp2i_corrections ===\n";
    $stmt = $pdo->query("DESCRIBE cp2i_corrections");
    while ($row = $stmt->fetch()) {
        echo $row['Field'] . " - " . $row['Type'] . "\n";
    }
    
    echo "\n=== DONNÉES DANS cp2i_corrections ===\n";
    $stmt = $pdo->query("SELECT * FROM cp2i_corrections LIMIT 3");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        print_r($row);
        echo "\n---\n";
    }
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage();
}
?>