<?php
require_once 'config.php';

echo "=== Vérification et correction de la contrainte d'affectations ===\n";

$db = getDB();

try {
    // 1. Vérifier la structure actuelle
    echo "1. Vérification de la structure actuelle:\n";
    $stmt = $db->query("SHOW CREATE TABLE cp2i_affectations");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "   Structure actuelle:\n";
    echo "   " . $result['Create Table'] . "\n\n";
    
    // 2. Vérifier s'il y a des doublons
    echo "2. Vérification des doublons:\n";
    $stmt = $db->query("
        SELECT participant_id, COUNT(*) as count 
        FROM cp2i_affectations 
        GROUP BY participant_id 
        HAVING COUNT(*) > 1
    ");
    $doublons = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($doublons) > 0) {
        echo "   ⚠️  Doublons détectés:\n";
        foreach ($doublons as $doublon) {
            echo "   - Participant ID {$doublon['participant_id']}: {$doublon['count']} affectations\n";
        }
        
        // Nettoyer les doublons (garder le plus récent)
        echo "\n3. Nettoyage des doublons:\n";
        foreach ($doublons as $doublon) {
            $stmt = $db->prepare("
                DELETE FROM cp2i_affectations 
                WHERE participant_id = ? 
                AND id NOT IN (
                    SELECT * FROM (
                        SELECT MAX(id) FROM cp2i_affectations 
                        WHERE participant_id = ?
                    ) as temp
                )
            ");
            $stmt->execute([$doublon['participant_id'], $doublon['participant_id']]);
            echo "   ✓ Doublons supprimés pour participant {$doublon['participant_id']}\n";
        }
    } else {
        echo "   ✓ Aucun doublon détecté\n";
    }
    
    // 3. Supprimer l'ancienne contrainte si elle existe
    echo "\n4. Mise à jour de la contrainte:\n";
    try {
        $db->exec("ALTER TABLE cp2i_affectations DROP INDEX unique_affectation");
        echo "   ✓ Ancienne contrainte 'unique_affectation' supprimée\n";
    } catch (PDOException $e) {
        echo "   ℹ️  Ancienne contrainte 'unique_affectation' n'existe pas\n";
    }
    
    try {
        $db->exec("ALTER TABLE cp2i_affectations DROP INDEX unique_participant");
        echo "   ✓ Ancienne contrainte 'unique_participant' supprimée\n";
    } catch (PDOException $e) {
        echo "   ℹ️  Ancienne contrainte 'unique_participant' n'existe pas\n";
    }
    
    // 4. Ajouter la nouvelle contrainte
    try {
        $db->exec("ALTER TABLE cp2i_affectations ADD UNIQUE KEY unique_participant (participant_id)");
        echo "   ✓ Nouvelle contrainte 'unique_participant' ajoutée\n";
    } catch (PDOException $e) {
        echo "   ⚠️  Erreur lors de l'ajout de la contrainte: " . $e->getMessage() . "\n";
    }
    
    // 5. Vérifier la structure finale
    echo "\n5. Vérification de la structure finale:\n";
    $stmt = $db->query("SHOW CREATE TABLE cp2i_affectations");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "   Structure finale:\n";
    echo "   " . $result['Create Table'] . "\n";
    
    // 6. Test de la contrainte
    echo "\n6. Test de la contrainte:\n";
    $stmt = $db->query("SELECT id FROM cp2i_users WHERE role = 'participant' LIMIT 1");
    $participant = $stmt->fetch();
    
    $stmt = $db->query("SELECT id FROM cp2i_users WHERE role = 'correcteur' LIMIT 2");
    $correcteurs = $stmt->fetchAll();
    
    if ($participant && count($correcteurs) >= 2) {
        try {
            // Premier correcteur
            $stmt = $db->prepare("INSERT IGNORE INTO cp2i_affectations (participant_id, corrector_id) VALUES (?, ?)");
            $stmt->execute([$participant['id'], $correcteurs[0]['id']]);
            echo "   ✓ Première affectation créée\n";
            
            // Tentative de deuxième correcteur (doit échouer)
            $stmt = $db->prepare("INSERT INTO cp2i_affectations (participant_id, corrector_id) VALUES (?, ?)");
            $stmt->execute([$participant['id'], $correcteurs[1]['id']]);
            echo "   ❌ ERREUR: La contrainte ne fonctionne pas!\n";
        } catch (PDOException $e) {
            echo "   ✓ Contrainte fonctionne: " . $e->getMessage() . "\n";
        }
    } else {
        echo "   ℹ️  Pas assez d'utilisateurs pour tester la contrainte\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}

echo "\n=== Vérification terminée ===\n";
?>