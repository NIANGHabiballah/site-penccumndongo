<?php
require_once 'config.php';
require_once 'cp2i-auth.php';

echo "=== Synchronisation de tous les mots de passe ===\n";

$db = getDB();

// Récupérer tous les utilisateurs admin/correcteur (y compris ceux avec email invalide)
$stmt = $db->prepare("SELECT id, email, role, plain_password FROM cp2i_users WHERE role IN ('admin', 'correcteur') OR email = 'moussafall'");
$stmt->execute();
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Utilisateurs à traiter: " . count($users) . "\n\n";

// Mots de passe par défaut pour les comptes sans plain_password
$defaultPasswords = [
    'pencc.penccumndongo@gmail.com' => 'wBgyFTjY',
    'test@admin.com' => 'admin123',
    'admin@cp2i.com' => 'admin123', 
    'correcteur@cp2i.com' => 'correcteur123',
    'tafsirhabyng27@gmail.com' => 'tafsir123',
    'moussafall' => 'moussa123',
    'badara@gmail.com' => 'badara123',
    'fantambaye@gmail.com' => 'SM4qx5Rf'
];

foreach ($users as $user) {
    echo "Traitement: {$user['email']} ({$user['role']})\n";
    
    $passwordToUse = null;
    
    if ($user['plain_password']) {
        // Utiliser le mot de passe existant
        $passwordToUse = $user['plain_password'];
        echo "  - Utilisation du mot de passe existant\n";
    } elseif (isset($defaultPasswords[$user['email']])) {
        // Utiliser le mot de passe par défaut
        $passwordToUse = $defaultPasswords[$user['email']];
        echo "  - Attribution du mot de passe par défaut\n";
    } else {
        // Générer un nouveau mot de passe
        $passwordToUse = 'CP2i' . rand(1000, 9999);
        echo "  - Génération d'un nouveau mot de passe: $passwordToUse\n";
    }
    
    if (setUserPassword($db, $user['id'], $passwordToUse, $user['role'])) {
        echo "  ✓ Synchronisé avec succès - Mot de passe: $passwordToUse\n";
    } else {
        echo "  ✗ Erreur de synchronisation\n";
    }
    echo "\n";
}

echo "\n=== Synchronisation terminée ===\n";
?>