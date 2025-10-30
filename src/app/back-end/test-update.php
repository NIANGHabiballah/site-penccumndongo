<?php
require_once 'config.php';

echo "=== Test de modification utilisateur ===\n";

$db = getDB();

// Test 1: Vérifier la structure de la table
echo "1. Structure de la table cp2i_users:\n";
$stmt = $db->query("DESCRIBE cp2i_users");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "   - {$row['Field']}: {$row['Type']}\n";
}

// Test 2: Lister les utilisateurs existants
echo "\n2. Utilisateurs existants:\n";
$stmt = $db->query("SELECT id, email, nom, prenom, role FROM cp2i_users LIMIT 5");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "   - ID: {$row['id']}, Email: {$row['email']}, Nom: {$row['prenom']} {$row['nom']}, Rôle: {$row['role']}\n";
}

// Test 3: Simuler une modification
echo "\n3. Test de modification (simulation):\n";
$testId = 2; // ID existant du correcteur
$stmt = $db->prepare("SELECT * FROM cp2i_users WHERE id = ?");
$stmt->execute([$testId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    echo "   Utilisateur trouvé: {$user['email']}\n";
    
    // Test de mise à jour (nom seulement)
    $newNom = 'Test Modifié';
    $stmt = $db->prepare("UPDATE cp2i_users SET nom = ? WHERE id = ?");
    $result = $stmt->execute([$newNom, $testId]);
    
    if ($result) {
        echo "   ✓ Modification réussie\n";
        
        // Vérifier la modification
        $stmt = $db->prepare("SELECT nom FROM cp2i_users WHERE id = ?");
        $stmt->execute([$testId]);
        $updated = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "   Nouveau nom: {$updated['nom']}\n";
    } else {
        echo "   ✗ Échec de la modification\n";
    }
} else {
    echo "   Aucun utilisateur trouvé avec l'ID $testId\n";
}

echo "\n=== Fin du test ===\n";
?>