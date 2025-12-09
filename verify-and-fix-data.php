<?php
require_once 'src/app/back-end/config.php';

echo "=== VÉRIFICATION ET CORRECTION DES DONNÉES CP2i ===\n\n";

try {
    $db = getDB();
    
    // 1. VÉRIFICATION DE L'INTÉGRITÉ DES DONNÉES
    echo "1. Vérification de l'intégrité des données...\n";
    
    // Textes orphelins
    $stmt = $db->query("
        SELECT COUNT(*) as count 
        FROM cp2i_textes 
        WHERE participant_id NOT IN (SELECT id FROM cp2i_users)
    ");
    $orphaned_textes = $stmt->fetchColumn();
    echo "   - Textes orphelins: $orphaned_textes\n";
    
    // Corrections orphelines
    $stmt = $db->query("
        SELECT COUNT(*) as count 
        FROM cp2i_corrections 
        WHERE texte_id NOT IN (SELECT id FROM cp2i_textes)
    ");
    $orphaned_corrections = $stmt->fetchColumn();
    echo "   - Corrections orphelines: $orphaned_corrections\n";
    
    // Évaluations orphelines
    $stmt = $db->query("
        SELECT COUNT(*) as count 
        FROM cp2i_evaluations 
        WHERE texte_id NOT IN (SELECT id FROM cp2i_textes)
    ");
    $orphaned_evaluations = $stmt->fetchColumn();
    echo "   - Évaluations orphelines: $orphaned_evaluations\n";
    
    // 2. CORRECTION DES PROBLÈMES IDENTIFIÉS
    if ($orphaned_textes > 0 || $orphaned_corrections > 0 || $orphaned_evaluations > 0) {
        echo "\n2. Correction des données orphelines...\n";
        
        // Supprimer les données orphelines
        $db->exec("DELETE FROM cp2i_textes WHERE participant_id NOT IN (SELECT id FROM cp2i_users)");
        $db->exec("DELETE FROM cp2i_corrections WHERE texte_id NOT IN (SELECT id FROM cp2i_textes)");
        $db->exec("DELETE FROM cp2i_evaluations WHERE texte_id NOT IN (SELECT id FROM cp2i_textes)");
        
        echo "   ✅ Données orphelines supprimées\n";
    }
    
    // 3. VÉRIFICATION DES STATUTS
    echo "\n3. Vérification des statuts...\n";
    $stmt = $db->query("
        SELECT statut, COUNT(*) as count 
        FROM cp2i_textes 
        GROUP BY statut
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $statut = $row['statut'] ?: 'NULL';
        echo "   - Statut '$statut': {$row['count']} textes\n";
    }
    
    // Corriger les statuts invalides
    $stmt = $db->prepare("
        UPDATE cp2i_textes 
        SET statut = 'en_attente' 
        WHERE statut IS NULL OR statut = '' OR statut NOT IN ('en_attente', 'accepte', 'refuse')
    ");
    $stmt->execute();
    $fixed_statuts = $stmt->rowCount();
    if ($fixed_statuts > 0) {
        echo "   ✅ $fixed_statuts statuts corrigés\n";
    }
    
    // 4. VÉRIFICATION DES NOTES
    echo "\n4. Vérification des notes...\n";
    
    // Notes invalides dans cp2i_textes
    $stmt = $db->query("SELECT COUNT(*) FROM cp2i_textes WHERE note < 0 OR note > 20");
    $invalid_notes_textes = $stmt->fetchColumn();
    echo "   - Notes invalides dans textes: $invalid_notes_textes\n";
    
    // Notes invalides dans cp2i_evaluations
    $stmt = $db->query("SELECT COUNT(*) FROM cp2i_evaluations WHERE note_totale < 0 OR note_totale > 20");
    $invalid_notes_eval = $stmt->fetchColumn();
    echo "   - Notes invalides dans évaluations: $invalid_notes_eval\n";
    
    // Corriger les notes invalides
    if ($invalid_notes_textes > 0) {
        $db->exec("UPDATE cp2i_textes SET note = NULL WHERE note < 0 OR note > 20");
        echo "   ✅ Notes invalides dans textes corrigées\n";
    }
    
    if ($invalid_notes_eval > 0) {
        $db->exec("
            UPDATE cp2i_evaluations 
            SET note_totale = GREATEST(0, LEAST(20, note_totale)),
                note_pertinence = GREATEST(0, LEAST(5, note_pertinence)),
                note_coherence = GREATEST(0, LEAST(5, note_coherence)),
                note_correction = GREATEST(0, LEAST(5, note_correction)),
                note_presentation = GREATEST(0, LEAST(5, note_presentation))
        ");
        echo "   ✅ Notes invalides dans évaluations corrigées\n";
    }
    
    // 5. RECALCUL DES NOTES FINALES
    echo "\n5. Recalcul des notes finales...\n";
    $stmt = $db->prepare("
        UPDATE cp2i_textes t
        SET note = (
            SELECT AVG(e.note_totale)
            FROM cp2i_evaluations e
            WHERE e.texte_id = t.id
            AND e.note_totale IS NOT NULL
        )
        WHERE EXISTS (
            SELECT 1 FROM cp2i_evaluations e 
            WHERE e.texte_id = t.id 
            AND e.note_totale IS NOT NULL
        )
    ");
    $stmt->execute();
    $recalculated = $stmt->rowCount();
    echo "   ✅ $recalculated notes finales recalculées\n";
    
    // 6. MISE À JOUR DES STATUTS BASÉS SUR LES NOTES
    echo "\n6. Mise à jour des statuts basés sur les notes...\n";
    $stmt = $db->prepare("
        UPDATE cp2i_textes 
        SET statut = CASE 
            WHEN note >= 10 THEN 'accepte'
            WHEN note < 10 AND note IS NOT NULL THEN 'refuse'
            ELSE 'en_attente'
        END
        WHERE note IS NOT NULL
    ");
    $stmt->execute();
    $updated_statuts = $stmt->rowCount();
    echo "   ✅ $updated_statuts statuts mis à jour\n";
    
    // 7. VÉRIFICATION DE LA COLONNE IMAGES
    echo "\n7. Vérification de la colonne images...\n";
    try {
        $stmt = $db->query("DESCRIBE chat_messages");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('images', $columns)) {
            $db->exec("ALTER TABLE chat_messages ADD COLUMN images TEXT NULL AFTER message");
            echo "   ✅ Colonne images ajoutée à chat_messages\n";
        } else {
            echo "   ✅ Colonne images existe déjà\n";
        }
    } catch (Exception $e) {
        echo "   ⚠️ Table chat_messages n'existe pas encore\n";
    }
    
    // 8. STATISTIQUES FINALES
    echo "\n8. Statistiques finales...\n";
    
    $stmt = $db->query("SELECT COUNT(*) FROM cp2i_users");
    $total_users = $stmt->fetchColumn();
    echo "   - Total utilisateurs: $total_users\n";
    
    $stmt = $db->query("SELECT COUNT(*) FROM cp2i_textes");
    $total_textes = $stmt->fetchColumn();
    echo "   - Total textes: $total_textes\n";
    
    $stmt = $db->query("SELECT COUNT(*) FROM cp2i_evaluations");
    $total_evaluations = $stmt->fetchColumn();
    echo "   - Total évaluations: $total_evaluations\n";
    
    $stmt = $db->query("
        SELECT statut, COUNT(*) as count 
        FROM cp2i_textes 
        GROUP BY statut 
        ORDER BY statut
    ");
    echo "   - Répartition par statut:\n";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "     * {$row['statut']}: {$row['count']}\n";
    }
    
    // 9. VÉRIFICATION DES CORRECTEURS
    echo "\n9. Vérification des correcteurs...\n";
    $stmt = $db->query("SELECT COUNT(*) FROM cp2i_users WHERE role = 'correcteur'");
    $correcteurs = $stmt->fetchColumn();
    echo "   - Nombre de correcteurs: $correcteurs\n";
    
    // Correcteurs avec évaluations
    $stmt = $db->query("
        SELECT u.email, COUNT(e.id) as nb_evaluations
        FROM cp2i_users u
        LEFT JOIN cp2i_evaluations e ON u.id = e.correcteur_id
        WHERE u.role = 'correcteur'
        GROUP BY u.id, u.email
        ORDER BY nb_evaluations DESC
    ");
    echo "   - Activité des correcteurs:\n";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "     * {$row['email']}: {$row['nb_evaluations']} évaluations\n";
    }
    
    echo "\n✅ VÉRIFICATION ET CORRECTION TERMINÉES AVEC SUCCÈS!\n";
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
?>