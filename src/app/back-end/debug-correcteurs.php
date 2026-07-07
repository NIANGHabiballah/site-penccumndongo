<?php
require_once 'config.php';

$db = getDB();

echo "=== DIAGNOSTIC CORRECTEURS ===\n\n";

// Vérifier les tables existantes
$tables = ['cp2i_corrections', 'cp2i_evaluations'];
foreach ($tables as $table) {
    try {
        $stmt = $db->prepare("SELECT COUNT(*) FROM $table");
        $stmt->execute();
        $count = $stmt->fetchColumn();
        echo "Table $table: $count enregistrements\n";
    } catch (Exception $e) {
        echo "Table $table: ERREUR - " . $e->getMessage() . "\n";
    }
}

echo "\n=== CORRECTEURS TAFSIR ===\n";
$stmt = $db->prepare("SELECT id, email, prenom, nom FROM cp2i_users WHERE email LIKE '%tafsir%'");
$stmt->execute();
$correcteurs = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($correcteurs as $correcteur) {
    echo "\nCorrecteur: {$correcteur['prenom']} {$correcteur['nom']} ({$correcteur['email']})\n";
    echo "ID: {$correcteur['id']}\n";
    
    // Affectations
    $stmt = $db->prepare("SELECT COUNT(*) FROM cp2i_affectations WHERE corrector_id = ?");
    $stmt->execute([$correcteur['id']]);
    $assignes = $stmt->fetchColumn();
    echo "Textes assignés: $assignes\n";
    
    // Détail des affectations
    $stmt = $db->prepare("SELECT texte_id FROM cp2i_affectations WHERE corrector_id = ?");
    $stmt->execute([$correcteur['id']]);
    $textes_assignes = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "IDs textes assignés: " . implode(', ', $textes_assignes) . "\n";
    
    // Vérifier cp2i_corrections
    $stmt = $db->prepare("SELECT COUNT(*) FROM cp2i_corrections WHERE corrector_id = ?");
    $stmt->execute([$correcteur['id']]);
    $corrections = $stmt->fetchColumn();
    echo "Corrections dans cp2i_corrections: $corrections\n";
    
    // Vérifier cp2i_evaluations
    $stmt = $db->prepare("SELECT COUNT(*) FROM cp2i_evaluations WHERE correcteur_id = ?");
    $stmt->execute([$correcteur['id']]);
    $evaluations = $stmt->fetchColumn();
    echo "Évaluations dans cp2i_evaluations: $evaluations\n";
    
    // Vérifier les évaluations sur SES textes assignés
    if (!empty($textes_assignes)) {
        $placeholders = str_repeat('?,', count($textes_assignes) - 1) . '?';
        
        $stmt = $db->prepare("SELECT COUNT(*) FROM cp2i_corrections WHERE corrector_id = ? AND texte_id IN ($placeholders)");
        $stmt->execute(array_merge([$correcteur['id']], $textes_assignes));
        $corrections_assignes = $stmt->fetchColumn();
        echo "Corrections sur textes assignés: $corrections_assignes\n";
        
        $stmt = $db->prepare("SELECT COUNT(*) FROM cp2i_evaluations WHERE correcteur_id = ? AND texte_id IN ($placeholders)");
        $stmt->execute(array_merge([$correcteur['id']], $textes_assignes));
        $evaluations_assignes = $stmt->fetchColumn();
        echo "Évaluations sur textes assignés: $evaluations_assignes\n";
    }
    
    echo "---\n";
}
?>