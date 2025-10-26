<?php
require_once 'config.php';

$db = getDB();

// Mots de passe à assigner
$passwords = [
    'test@admin.com' => 'testadmin2024',
    'pencc.penccumndongo@gmail.com' => '1234'
];

foreach ($passwords as $email => $password) {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    
    $stmt = $db->prepare("UPDATE cp2i_users SET password = ? WHERE email = ?");
    $result = $stmt->execute([$hash, $email]);
    
    if ($result) {
        echo "✓ Mot de passe mis à jour pour $email -> $password\n";
    } else {
        echo "✗ Erreur pour $email\n";
    }
}

echo "\nMise à jour terminée.\n";
?>