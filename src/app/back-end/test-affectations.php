<?php
require_once 'config.php';

echo "=== Test des affectations ===\n";

$db = getDB();

// Vérifier les participants
echo "1. Participants disponibles:\n";
$stmt = $db->query("SELECT id, email, nom, prenom FROM cp2i_users WHERE role = 'participant'");
$participants = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($participants as $p) {
    echo "   - ID: {$p['id']}, {$p['prenom']} {$p['nom']}\n";
}

// Vérifier les correcteurs
echo "\n2. Correcteurs disponibles:\n";
$stmt = $db->query("SELECT id, email, nom, prenom FROM cp2i_users WHERE role = 'correcteur'");
$correcteurs = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($correcteurs as $c) {
    echo "   - ID: {$c['id']}, {$c['prenom']} {$c['nom']}\n";
}

// Créer des affectations de test
if (count($participants) > 0 && count($correcteurs) > 0) {
    echo "\n3. Création d'affectations de test:\n";
    
    for ($i = 0; $i < min(3, count($participants)); $i++) {
        $participant = $participants[$i];
        $correcteur = $correcteurs[$i % count($correcteurs)];
        
        try {
            $stmt = $db->prepare("INSERT IGNORE INTO cp2i_affectations (participant_id, corrector_id) VALUES (?, ?)");
            $stmt->execute([$participant['id'], $correcteur['id']]);
            echo "   ✓ {$participant['prenom']} → {$correcteur['prenom']}\n";
        } catch (Exception $e) {
            echo "   ✗ Erreur: " . $e->getMessage() . "\n";
        }
    }
}

echo "\n=== Test terminé ===\n";
?>