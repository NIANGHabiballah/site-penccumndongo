<?php
require_once 'config.php';

echo "=== Correction des comptes non vérifiés ===\n";

$db = getDB();

// Comptes à vérifier
$accountsToVerify = [
    'badara@gmail.com',
    'fantambaye@gmail.com',
    'moussafall',
    'moussa0@gmail.com',
    'admintafsir@gmail.com',
    'gayeousmane@gmail.com'
];

foreach ($accountsToVerify as $email) {
    echo "Vérification du compte: $email\n";
    
    $stmt = $db->prepare("UPDATE cp2i_users SET email_verified = 1 WHERE email = ?");
    $result = $stmt->execute([$email]);
    
    if ($result && $stmt->rowCount() > 0) {
        echo "  ✓ Compte vérifié avec succès\n";
    } else {
        echo "  ✗ Compte non trouvé ou déjà vérifié\n";
    }
}

echo "\n=== Correction terminée ===\n";
echo "Tous les comptes peuvent maintenant se connecter !\n";
?>