<?php
header('Content-Type: text/plain');

// Décoder le hash fourni pour l'utilisateur 23
$hash_provided = 'MjMtMTguNS0yOSBv';
$decoded = base64_decode($hash_provided);

echo "Hash fourni: '$hash_provided'\n";
echo "Décodé: '$decoded'\n";

// Tester si on peut recréer ce hash
$recreated_hash = substr(base64_encode($decoded), 0, 16);
echo "Re-créé: '$recreated_hash'\n";
echo "Match: " . ($hash_provided === $recreated_hash ? 'OUI' : 'NON') . "\n";

// Analyser la structure
echo "\nAnalyse de la structure:\n";
$parts = explode('-', $decoded);
echo "Parties: " . print_r($parts, true);
?>