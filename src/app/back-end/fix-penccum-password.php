<?php
require_once 'config.php';
require_once 'cp2i-auth.php';

echo "=== Correction du mot de passe pencc.penccumndongo@gmail.com ===\n";

$db = getDB();
$email = 'pencc.penccumndongo@gmail.com';
$correctPassword = 'wBgyFTjY';

// Récupérer l'utilisateur
$stmt = $db->prepare("SELECT id, role FROM cp2i_users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    echo "Utilisateur trouvé: ID {$user['id']}, Rôle: {$user['role']}\n";
    
    // Utiliser la fonction centralisée pour corriger le mot de passe
    if (setUserPassword($db, $user['id'], $correctPassword, $user['role'])) {
        echo "✓ Mot de passe corrigé avec succès\n";
        echo "Email: $email\n";
        echo "Mot de passe: $correctPassword\n";
        
        // Vérifier que ça fonctionne
        $stmt = $db->prepare("SELECT password FROM cp2i_users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $newHash = $stmt->fetchColumn();
        
        if (password_verify($correctPassword, $newHash)) {
            echo "✓ Vérification réussie - Connexion possible\n";
        } else {
            echo "✗ Erreur de vérification\n";
        }
    } else {
        echo "✗ Erreur lors de la correction\n";
    }
} else {
    echo "✗ Utilisateur non trouvé\n";
}

echo "\n=== Correction terminée ===\n";
?>