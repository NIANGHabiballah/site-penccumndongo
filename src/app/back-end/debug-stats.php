<?php
require_once 'config.php';
setCorsHeaders();

echo "=== DEBUG STATISTIQUES CP2i ===\n\n";

try {
    $db = getDB();
    echo "✅ Connexion DB réussie\n\n";
    
    // Test direct des statistiques
    $stmt = $db->prepare("
        SELECT 
            COUNT(*) as total_textes,
            SUM(CASE WHEN statut = 'accepte' THEN 1 ELSE 0 END) as textes_acceptes,
            SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END) as textes_refuses,
            SUM(CASE WHEN statut = 'en_attente' OR statut IS NULL OR statut = '' THEN 1 ELSE 0 END) as textes_en_attente,
            AVG(CASE WHEN note IS NOT NULL AND note > 0 THEN note END) as note_moyenne
        FROM cp2i_textes
    ");
    $stmt->execute();
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "📊 STATISTIQUES BRUTES:\n";
    echo "Total textes: " . $stats['total_textes'] . "\n";
    echo "Acceptés: " . $stats['textes_acceptes'] . "\n";
    echo "Refusés: " . $stats['textes_refuses'] . "\n";
    echo "En attente: " . $stats['textes_en_attente'] . "\n";
    echo "Note moyenne: " . ($stats['note_moyenne'] ?: 'N/A') . "\n\n";
    
    // Détail des textes
    $stmt = $db->prepare("SELECT id, titre, statut, note FROM cp2i_textes LIMIT 10");
    $stmt->execute();
    $textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "📝 DÉTAIL DES TEXTES:\n";
    foreach ($textes as $texte) {
        echo "ID: {$texte['id']} | Titre: {$texte['titre']} | Statut: " . ($texte['statut'] ?: 'NULL') . " | Note: " . ($texte['note'] ?: 'NULL') . "\n";
    }
    
    // JSON pour l'API
    echo "\n🔧 JSON POUR API:\n";
    $result = [
        'stats' => [
            'total_textes' => (int)$stats['total_textes'],
            'textes_acceptes' => (int)$stats['textes_acceptes'],
            'textes_refuses' => (int)$stats['textes_refuses'],
            'textes_en_attente' => (int)$stats['textes_en_attente'],
            'note_moyenne' => $stats['note_moyenne'] ? round((float)$stats['note_moyenne'], 2) : null
        ]
    ];
    echo json_encode($result, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}
?>