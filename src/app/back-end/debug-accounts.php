<?php
require_once 'config.php';

echo "=== Debug des comptes ===\n";

$db = getDB();

// Test 1: Vérifier les utilisateurs
echo "1. Utilisateurs dans la base:\n";
try {
    $stmt = $db->query("SELECT id, email, nom, prenom, role FROM cp2i_users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Nombre d'utilisateurs: " . count($users) . "\n";
    foreach ($users as $user) {
        echo "   - ID: {$user['id']}, Email: {$user['email']}, Rôle: {$user['role']}\n";
    }
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}

// Test 2: Tester la requête complète
echo "\n2. Test de la requête complète:\n";
try {
    $stmt = $db->prepare("SELECT id, email, nom, prenom, role, email_verified, created_at, password, plain_password FROM cp2i_users ORDER BY role, created_at DESC");
    $stmt->execute();
    $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Nombre de comptes récupérés: " . count($accounts) . "\n";
} catch (Exception $e) {
    echo "Erreur dans la requête: " . $e->getMessage() . "\n";
}

echo "\n=== Fin du debug ===\n";
?>