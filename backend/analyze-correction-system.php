<?php
header('Content-Type: text/plain');
require_once 'config/database.php';

echo "=== ANALYSE DU SYSTÈME DE CORRECTION ===\n\n";

try {
    // 1. Vérifier les fichiers de correction existants
    echo "1. FICHIERS DE CORRECTION EXISTANTS:\n";
    $files = glob('cp2i-*.php');
    foreach ($files as $file) {
        if (strpos($file, 'correct') !== false || strpos($file, 'eval') !== false) {
            echo "- $file\n";
        }
    }
    
    // 2. Structure de cp2i_evaluations
    echo "\n2. STRUCTURE DE cp2i_evaluations:\n";
    $stmt = $pdo->query("DESCRIBE cp2i_evaluations");
    while ($row = $stmt->fetch()) {
        echo "- {$row['Field']}: {$row['Type']}\n";
    }
    
    // 3. Données dans cp2i_evaluations
    echo "\n3. DONNÉES DANS cp2i_evaluations:\n";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM cp2i_evaluations");
    $count = $stmt->fetch()['count'];
    echo "Nombre total: $count\n";
    
    if ($count > 0) {
        $stmt = $pdo->query("SELECT * FROM cp2i_evaluations LIMIT 3");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo "ID: {$row['id']}, Texte: {$row['texte_id']}, Note: {$row['note_totale']}\n";
        }
    }
    
    // 4. Textes avec notes mais sans évaluations détaillées
    echo "\n4. TEXTES AVEC NOTES MAIS SANS ÉVALUATIONS DÉTAILLÉES:\n";
    $stmt = $pdo->query("
        SELECT t.id, t.titre, t.note, t.statut
        FROM cp2i_textes t
        LEFT JOIN cp2i_evaluations e ON t.id = e.texte_id
        WHERE t.note IS NOT NULL AND e.id IS NULL
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "- Texte ID {$row['id']}: '{$row['titre']}' - Note: {$row['note']}/20\n";
    }
    
    // 5. Affectations
    echo "\n5. AFFECTATIONS CORRECTEUR-TEXTE:\n";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM cp2i_affectations");
    $count = $stmt->fetch()['count'];
    echo "Nombre d'affectations: $count\n";
    
    if ($count > 0) {
        $stmt = $pdo->query("SELECT * FROM cp2i_affectations LIMIT 3");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            print_r($row);
        }
    }
    
    echo "\n=== RECOMMANDATIONS ===\n";
    echo "1. cp2i_evaluations est vide - le système de correction n'enregistre pas les détails\n";
    echo "2. Il faut créer/modifier l'interface correcteur pour sauvegarder dans cp2i_evaluations\n";
    echo "3. Les correcteurs devront re-corriger pour avoir les notes par critère\n";
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage();
}
?>