<?php
require_once 'config.php';

$db = getDB();

// Corriger le mot de passe pour pencc.penccumndongo@gmail.com
$email = 'pencc.penccumndongo@gmail.com';
$newPassword = 'wBgyFTjY';

// Générer le nouveau hash
$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

// Mettre à jour la base de données
$stmt = $db->prepare("UPDATE cp2i_users SET password = ?, plain_password = ? WHERE email = ?");
$result = $stmt->execute([$hashedPassword, $newPassword, $email]);

if ($result) {
    echo "✓ Mot de passe corrigé pour $email\n";
    echo "Nouveau hash: $hashedPassword\n";
    echo "Mot de passe en clair: $newPassword\n";
    
    // Vérifier que ça fonctionne
    if (password_verify($newPassword, $hashedPassword)) {
        echo "✓ Vérification réussie\n";
    } else {
        echo "✗ Erreur de vérification\n";
    }
} else {
    echo "✗ Erreur lors de la mise à jour\n";
}
?>