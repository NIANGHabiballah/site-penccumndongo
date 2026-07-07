<?php
require_once 'src/app/back-end/config.php';

$db = getDB();

echo "=== STRUCTURE DES TABLES ===\n\n";

// Vérifier cp2i_evaluations
echo "TABLE: cp2i_evaluations\n";
try {
    $stmt = $db->prepare("DESCRIBE cp2i_evaluations");
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "- {$col['Field']} ({$col['Type']})\n";
    }
    
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM cp2i_evaluations");
    $stmt->execute();
    $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "Nombre d'enregistrements: $count\n\n";
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n\n";
}

// Vérifier cp2i_corrections
echo "TABLE: cp2i_corrections\n";
try {
    $stmt = $db->prepare("DESCRIBE cp2i_corrections");
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "- {$col['Field']} ({$col['Type']})\n";
    }
    
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM cp2i_corrections");
    $stmt->execute();
    $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "Nombre d'enregistrements: $count\n\n";
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n\n";
}

// Vérifier cp2i_affectations
echo "TABLE: cp2i_affectations\n";
try {
    $stmt = $db->prepare("DESCRIBE cp2i_affectations");
    $stmt->execute();
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "- {$col['Field']} ({$col['Type']})\n";
    }
    
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM cp2i_affectations");
    $stmt->execute();
    $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "Nombre d'enregistrements: $count\n\n";
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n\n";
}

// Test avec un correcteur spécifique
echo "=== TEST CORRECTEUR TAFSIR ===\n";
$stmt = $db->prepare("SELECT id, email FROM cp2i_users WHERE email LIKE '%tafsir%'");
$stmt->execute();
$correcteurs = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($correcteurs as $correcteur) {
    echo "Correcteur: {$correcteur['email']} (ID: {$correcteur['id']})\n";
    
    // Affectations
    $stmt = $db->prepare("SELECT COUNT(*) FROM cp2i_affectations WHERE corrector_id = ?");
    $stmt->execute([$correcteur['id']]);
    $assignes = $stmt->fetchColumn();
    echo "Assignés: $assignes\n";
    
    // Évaluations
    $stmt = $db->prepare("SELECT COUNT(*) FROM cp2i_evaluations WHERE correcteur_id = ?");
    $stmt->execute([$correcteur['id']]);
    $eval_count = $stmt->fetchColumn();
    echo "Évaluations: $eval_count\n";
    
    // Corrections
    $stmt = $db->prepare("SELECT COUNT(*) FROM cp2i_corrections WHERE corrector_id = ?");
    $stmt->execute([$correcteur['id']]);
    $corr_count = $stmt->fetchColumn();
    echo "Corrections: $corr_count\n\n";
}
?>