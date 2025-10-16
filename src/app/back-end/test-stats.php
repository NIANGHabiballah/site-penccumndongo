<?php
require_once 'config.php';

echo "=== Test des statistiques ===\n";

$db = getDB();

// Vérifier les tables nécessaires
echo "1. Vérification des tables:\n";
$tables = ['cp2i_users', 'cp2i_textes', 'cp2i_affectations'];
foreach ($tables as $table) {
    try {
        $stmt = $db->query("SELECT COUNT(*) FROM $table");
        $count = $stmt->fetchColumn();
        echo "   ✓ $table: $count enregistrements\n";
    } catch (Exception $e) {
        echo "   ✗ $table: " . $e->getMessage() . "\n";
    }
}

// Test des requêtes de statistiques
echo "\n2. Test des requêtes:\n";

// Stats d'affectation
try {
    $stmt = $db->prepare("
        SELECT 
            COUNT(DISTINCT p.id) as participants_affectes,
            COUNT(DISTINCT CASE WHEN a.participant_id IS NULL THEN p.id END) as participants_non_affectes
        FROM cp2i_users p
        LEFT JOIN cp2i_affectations a ON p.id = a.participant_id
        WHERE p.role = 'participant'
    ");
    $stmt->execute();
    $affectation_stats = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "   ✓ Affectations: " . json_encode($affectation_stats) . "\n";
} catch (Exception $e) {
    echo "   ✗ Erreur affectations: " . $e->getMessage() . "\n";
}

// Stats par correcteur
try {
    $stmt = $db->prepare("
        SELECT 
            c.id, c.nom, c.prenom,
            COUNT(a.participant_id) as participants_assignes,
            COUNT(CASE WHEN t.statut IN ('accepte', 'refuse') THEN t.id END) as textes_corriges,
            COUNT(CASE WHEN t.statut = 'en_attente' THEN t.id END) as textes_restants
        FROM cp2i_users c
        LEFT JOIN cp2i_affectations a ON c.id = a.corrector_id
        LEFT JOIN cp2i_textes t ON a.participant_id = t.user_id
        WHERE c.role = 'correcteur'
        GROUP BY c.id
    ");
    $stmt->execute();
    $correcteurs_stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "   ✓ Correcteurs: " . count($correcteurs_stats) . " trouvés\n";
    foreach ($correcteurs_stats as $c) {
        echo "      - {$c['prenom']} {$c['nom']}: {$c['participants_assignes']} participants\n";
    }
} catch (Exception $e) {
    echo "   ✗ Erreur correcteurs: " . $e->getMessage() . "\n";
}

echo "\n=== Fin du test ===\n";
?>