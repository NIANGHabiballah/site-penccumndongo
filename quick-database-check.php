<?php
require_once 'src/app/back-end/config.php';

echo "=== VÉRIFICATION RAPIDE DE LA BASE DE DONNÉES ===\n\n";

try {
    $db = getDB();
    
    // 1. État général
    echo "1. ÉTAT GÉNÉRAL\n";
    $stmt = $db->query("SELECT COUNT(*) FROM cp2i_users");
    echo "   Utilisateurs: " . $stmt->fetchColumn() . "\n";
    
    $stmt = $db->query("SELECT COUNT(*) FROM cp2i_textes");
    echo "   Textes: " . $stmt->fetchColumn() . "\n";
    
    $stmt = $db->query("SELECT COUNT(*) FROM cp2i_evaluations");
    echo "   Évaluations: " . $stmt->fetchColumn() . "\n";
    
    // 2. Problèmes critiques
    echo "\n2. PROBLÈMES CRITIQUES\n";
    
    // Textes orphelins
    $stmt = $db->query("SELECT COUNT(*) FROM cp2i_textes WHERE participant_id NOT IN (SELECT id FROM cp2i_users)");
    $orphaned = $stmt->fetchColumn();
    echo "   Textes orphelins: " . ($orphaned > 0 ? "❌ $orphaned" : "✅ 0") . "\n";
    
    // Statuts invalides
    $stmt = $db->query("SELECT COUNT(*) FROM cp2i_textes WHERE statut NOT IN ('en_attente', 'accepte', 'refuse') OR statut IS NULL");
    $invalid_status = $stmt->fetchColumn();
    echo "   Statuts invalides: " . ($invalid_status > 0 ? "❌ $invalid_status" : "✅ 0") . "\n";
    
    // Notes invalides
    $stmt = $db->query("SELECT COUNT(*) FROM cp2i_textes WHERE note < 0 OR note > 20");
    $invalid_notes = $stmt->fetchColumn();
    echo "   Notes invalides: " . ($invalid_notes > 0 ? "❌ $invalid_notes" : "✅ 0") . "\n";
    
    // 3. Premiers éléments
    echo "\n3. PREMIERS ÉLÉMENTS\n";
    $stmt = $db->query("
        SELECT t.id, t.titre, u.email, t.statut 
        FROM cp2i_textes t 
        LEFT JOIN cp2i_users u ON t.participant_id = u.id 
        ORDER BY t.id LIMIT 5
    ");
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $email = $row['email'] ?: '❌ ORPHELIN';
        echo "   ID {$row['id']}: {$row['titre']} - $email - {$row['statut']}\n";
    }
    
    // 4. Recommandations
    echo "\n4. RECOMMANDATIONS\n";
    if ($orphaned > 0 || $invalid_status > 0 || $invalid_notes > 0) {
        echo "   ⚠️  CORRECTION NÉCESSAIRE\n";
        echo "   Exécutez: php verify-and-fix-data.php\n";
    } else {
        echo "   ✅ Base de données en bon état\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}
?>