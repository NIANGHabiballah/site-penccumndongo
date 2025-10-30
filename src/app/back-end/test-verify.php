<?php
header('Content-Type: text/plain');

// Test direct du code
$code = 'CP2i-26-2025-MjYtbnVsbC0yOSBv';

// Décoder le hash fourni
$hash_provided = 'MjYtbnVsbC0yOSBv';
$decoded = base64_decode($hash_provided);
echo "Hash fourni décodé: '$decoded'\n";

// Tester différentes combinaisons
$combinations = [
    '26-null-29 Oct-CP2i2025',
    '26-null-29 oct-CP2i2025', 
    '26-null-29 O-CP2i2025',
    '26-null-29 o-CP2i2025'
];

foreach ($combinations as $data) {
    $hash = substr(base64_encode($data), 0, 16);
    echo "Data: '$data' -> Hash: '$hash'\n";
    if ($hash === $hash_provided) {
        echo "*** MATCH TROUVÉ ! ***\n";
    }
}

// Test avec le décodage exact
echo "\nTest reverse engineering:\n";
echo "Si le hash décode '$decoded', alors:\n";
$reverse_hash = substr(base64_encode($decoded), 0, 16);
echo "Re-encodé: '$reverse_hash'\n";
?>