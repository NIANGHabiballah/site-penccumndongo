<?php
header('Content-Type: text/plain');
require_once 'config/database.php';

try {
    
    echo "=== VÉRIFICATION DU SYSTÈME DE CORRECTION ===\n\n";
    
    // 1. Vérifier cp2i_corrections
    echo "1. Table cp2i_corrections:\n";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM cp2i_corrections");
    $count = $stmt->fetch();
    echo "Nombre de corrections: " . $count['count'] . "\n";
    
    if ($count['count'] > 0) {
        $stmt = $pdo->query("SELECT * FROM cp2i_corrections ORDER BY created_at DESC LIMIT 3");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo "- Texte ID: {$row['texte_id']}, Note: {$row['note']}, Date: {$row['created_at']}\n";
        }
    }
    
    // 2. Vérifier cp2i_evaluations
    echo "\n2. Table cp2i_evaluations:\n";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM cp2i_evaluations");
    $count = $stmt->fetch();
    echo "Nombre d'évaluations: " . $count['count'] . "\n";
    
    if ($count['count'] > 0) {
        $stmt = $pdo->query("SELECT * FROM cp2i_evaluations ORDER BY created_at DESC LIMIT 3");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo "- Texte ID: {$row['texte_id']}, Note: {$row['note_totale']}, Date: {$row['created_at']}\n";
        }
    }
    
    // 3. Vérifier les notes dans cp2i_textes
    echo "\n3. Notes dans cp2i_textes:\n";
    $stmt = $pdo->query("SELECT id, titre, note, statut FROM cp2i_textes WHERE note IS NOT NULL ORDER BY id DESC");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "- ID: {$row['id']}, Titre: {$row['titre']}, Note: {$row['note']}, Statut: {$row['statut']}\n";
    }
    
    // 4. Vérifier les affectations
    echo "\n4. Affectations (cp2i_affectations):\n";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM cp2i_affectations");
    $count = $stmt->fetch();
    echo "Nombre d'affectations: " . $count['count'] . "\n";
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage();
}
?>