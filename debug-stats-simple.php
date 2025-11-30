<?php
require_once 'src/app/back-end/config.php';

$db = getDB();

echo "=== DEBUG STATS CORRECTEURS ===\n\n";

// Liste des correcteurs
$stmt = $db->prepare("SELECT id, prenom, nom, email FROM cp2i_users WHERE role = 'correcteur' ORDER BY nom");
$stmt->execute();
$correcteurs = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($correcteurs as $correcteur) {
    echo "CORRECTEUR: {$correcteur['prenom']} {$correcteur['nom']} ({$correcteur['email']})\n";
    echo "ID: {$correcteur['id']}\n";
    
    // Textes assignés
    $stmt = $db->prepare("SELECT COUNT(*) FROM cp2i_affectations WHERE corrector_id = ?");
    $stmt->execute([$correcteur['id']]);
    $assignes = $stmt->fetchColumn();
    echo "Assignés: $assignes\n";
    
    // Textes évalués par ce correcteur
    $stmt = $db->prepare("SELECT COUNT(*) FROM cp2i_evaluations WHERE correcteur_id = ?");
    $stmt->execute([$correcteur['id']]);
    $evalues = $stmt->fetchColumn();
    echo "Évalués: $evalues\n";
    
    // En attente
    $attente = $assignes - $evalues;
    echo "En attente: $attente\n";
    
    echo "---\n";
}
?>