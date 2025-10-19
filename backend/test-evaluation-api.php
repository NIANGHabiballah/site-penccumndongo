<?php
require_once 'config/database.php';

// Simuler une requête GET avec texte_id
$_GET['texte_id'] = 1; // Remplacer par l'ID réel du texte de Louise

// Inclure le script d'évaluation
ob_start();
include 'get-evaluation-details.php';
$output = ob_get_clean();

echo "=== TEST API ÉVALUATION DÉTAILLÉE ===\n\n";
echo "Réponse de l'API:\n";
echo $output;
echo "\n\n=== FIN DU TEST ===\n";
?>