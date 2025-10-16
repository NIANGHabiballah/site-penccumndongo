<?php
// Générer les hashs corrects pour les mots de passe
echo "Hash pour 'password123': " . password_hash('password123', PASSWORD_DEFAULT) . "\n";
echo "Hash pour '1234': " . password_hash('1234', PASSWORD_DEFAULT) . "\n";
echo "Hash pour 'admin': " . password_hash('admin', PASSWORD_DEFAULT) . "\n";

// Vérifier les hashs existants
$existing_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
echo "\nVérification du hash existant:\n";
echo "password123: " . (password_verify('password123', $existing_hash) ? 'OUI' : 'NON') . "\n";
echo "password: " . (password_verify('password', $existing_hash) ? 'OUI' : 'NON') . "\n";
echo "secret: " . (password_verify('secret', $existing_hash) ? 'OUI' : 'NON') . "\n";
echo "admin: " . (password_verify('admin', $existing_hash) ? 'OUI' : 'NON') . "\n";
echo "1234: " . (password_verify('1234', $existing_hash) ? 'OUI' : 'NON') . "\n";
?>