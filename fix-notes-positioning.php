<?php
require_once 'src/app/back-end/config.php';

echo "=== CORRECTION DU POSITIONNEMENT DES NOTES OFFICIELLES ===\n\n";

try {
    $db = getDB();
    
    // 1. VÉRIFICATION DE LA STRUCTURE DES TABLES DE NOTES
    echo "1. Vérification de la structure des tables...\n";
    
    // Vérifier cp2i_evaluations
    $stmt = $db->query("SHOW TABLES LIKE 'cp2i_evaluations'");
    if ($stmt->rowCount() > 0) {
        echo "   ✅ Table cp2i_evaluations existe\n";
        
        $stmt = $db->query("DESCRIBE cp2i_evaluations");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "   Colonnes: " . implode(', ', $columns) . "\n";
        
        $stmt = $db->query("SELECT COUNT(*) FROM cp2i_evaluations");
        $count = $stmt->fetchColumn();
        echo "   Nombre d'évaluations: $count\n";
    } else {
        echo "   ❌ Table cp2i_evaluations manquante\n";
    }
    
    // Vérifier cp2i_corrections
    $stmt = $db->query("SHOW TABLES LIKE 'cp2i_corrections'");
    if ($stmt->rowCount() > 0) {
        echo "   ✅ Table cp2i_corrections existe\n";
        
        $stmt = $db->query("SELECT COUNT(*) FROM cp2i_corrections");
        $count = $stmt->fetchColumn();
        echo "   Nombre de corrections: $count\n";
    } else {
        echo "   ❌ Table cp2i_corrections manquante\n";
    }
    
    // 2. VÉRIFICATION DES NOTES DANS CP2I_TEXTES
    echo "\n2. Vérification des notes dans cp2i_textes...\n";
    
    $stmt = $db->query("
        SELECT 
            COUNT(*) as total_textes,
            COUNT(CASE WHEN note IS NOT NULL AND note > 0 THEN 1 END) as textes_avec_notes,
            AVG(CASE WHEN note IS NOT NULL AND note > 0 THEN note END) as note_moyenne,
            MIN(CASE WHEN note IS NOT NULL AND note > 0 THEN note END) as note_min,
            MAX(CASE WHEN note IS NOT NULL AND note > 0 THEN note END) as note_max
        FROM cp2i_textes
    ");
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "   Total textes: {$stats['total_textes']}\n";
    echo "   Textes avec notes: {$stats['textes_avec_notes']}\n";
    echo "   Note moyenne: " . ($stats['note_moyenne'] ? round($stats['note_moyenne'], 2) : 'N/A') . "\n";
    echo "   Note min: " . ($stats['note_min'] ?: 'N/A') . "\n";
    echo "   Note max: " . ($stats['note_max'] ?: 'N/A') . "\n";
    
    // 3. VÉRIFICATION DES ÉVALUATIONS DÉTAILLÉES
    echo "\n3. Vérification des évaluations détaillées...\n";
    
    if ($stmt = $db->query("SHOW TABLES LIKE 'cp2i_evaluations'") and $stmt->rowCount() > 0) {
        $stmt = $db->query("
            SELECT 
                COUNT(*) as total_evaluations,
                COUNT(CASE WHEN note_totale IS NOT NULL AND note_totale > 0 THEN 1 END) as evaluations_avec_notes,
                AVG(CASE WHEN note_totale IS NOT NULL AND note_totale > 0 THEN note_totale END) as note_moyenne_eval,
                COUNT(DISTINCT texte_id) as textes_evalues,
                COUNT(DISTINCT correcteur_id) as correcteurs_actifs
            FROM cp2i_evaluations
        ");
        $evalStats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo "   Total évaluations: {$evalStats['total_evaluations']}\n";
        echo "   Évaluations avec notes: {$evalStats['evaluations_avec_notes']}\n";
        echo "   Note moyenne évaluations: " . ($evalStats['note_moyenne_eval'] ? round($evalStats['note_moyenne_eval'], 2) : 'N/A') . "\n";
        echo "   Textes évalués: {$evalStats['textes_evalues']}\n";
        echo "   Correcteurs actifs: {$evalStats['correcteurs_actifs']}\n";
    }
    
    // 4. SYNCHRONISATION DES NOTES
    echo "\n4. Synchronisation des notes entre tables...\n";
    
    // Recalculer les notes des textes basées sur les évaluations
    if ($stmt = $db->query("SHOW TABLES LIKE 'cp2i_evaluations'") and $stmt->rowCount() > 0) {
        $stmt = $db->prepare("
            UPDATE cp2i_textes t
            SET note = (
                SELECT AVG(e.note_totale)
                FROM cp2i_evaluations e
                WHERE e.texte_id = t.id
                AND e.note_totale IS NOT NULL
                AND e.note_totale > 0
            )
            WHERE EXISTS (
                SELECT 1 FROM cp2i_evaluations e 
                WHERE e.texte_id = t.id 
                AND e.note_totale IS NOT NULL
                AND e.note_totale > 0
            )
        ");
        $stmt->execute();
        $updated = $stmt->rowCount();
        echo "   ✅ $updated notes de textes mises à jour depuis les évaluations\n";
    }
    
    // 5. CORRECTION DES STATUTS BASÉS SUR LES NOTES
    echo "\n5. Correction des statuts basés sur les notes...\n";
    
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
    $updated = $stmt->rowCount();
    echo "   ✅ $updated statuts mis à jour basés sur les notes\n";
    
    // 6. VÉRIFICATION DES PARTICIPANTS AVEC NOTES
    echo "\n6. Analyse des participants avec notes...\n";
    
    $stmt = $db->query("
        SELECT 
            u.prenom, u.nom, u.email,
            COUNT(t.id) as nb_textes,
            AVG(CASE WHEN t.note IS NOT NULL AND t.note > 0 THEN t.note END) as note_moyenne,
            GROUP_CONCAT(CONCAT(t.titre, ' (', COALESCE(t.note, 'N/A'), ')') SEPARATOR '; ') as detail_textes
        FROM cp2i_users u
        LEFT JOIN cp2i_textes t ON u.id = t.participant_id
        WHERE u.role = 'participant'
        GROUP BY u.id, u.prenom, u.nom, u.email
        HAVING nb_textes > 0
        ORDER BY note_moyenne DESC NULLS LAST
        LIMIT 10
    ");
    
    echo "   Top 10 participants avec notes:\n";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $note = $row['note_moyenne'] ? round($row['note_moyenne'], 2) . '/20' : 'N/A';\n        echo \"     {$row['prenom']} {$row['nom']} - $note ({$row['nb_textes']} textes)\\n\";\n    }\n    \n    // 7. VÉRIFICATION DES PARTICIPANTS SANS NOTES\n    echo \"\\n7. Participants sans notes...\\n\";\n    \n    $stmt = $db->query(\"\n        SELECT \n            u.prenom, u.nom, u.email,\n            COUNT(t.id) as nb_textes\n        FROM cp2i_users u\n        LEFT JOIN cp2i_textes t ON u.id = t.participant_id\n        WHERE u.role = 'participant'\n        GROUP BY u.id, u.prenom, u.nom, u.email\n        HAVING nb_textes > 0 AND (AVG(t.note) IS NULL OR AVG(t.note) = 0)\n        ORDER BY u.nom, u.prenom\n        LIMIT 10\n    \");\n    \n    $count = 0;\n    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {\n        echo \"     {$row['prenom']} {$row['nom']} - {$row['nb_textes']} texte(s) sans note\\n\";\n        $count++;\n    }\n    \n    if ($count === 0) {\n        echo \"   ✅ Tous les participants avec textes ont des notes\\n\";\n    } else {\n        echo \"   ⚠️ $count participants ont des textes sans notes\\n\";\n    }\n    \n    // 8. CORRECTION DES DONNÉES MANQUANTES\n    echo \"\\n8. Correction des données manquantes...\\n\";\n    \n    // Vérifier les textes sans participant_id valide\n    $stmt = $db->query(\"\n        SELECT COUNT(*) \n        FROM cp2i_textes \n        WHERE participant_id NOT IN (SELECT id FROM cp2i_users)\n    \");\n    $orphaned = $stmt->fetchColumn();\n    \n    if ($orphaned > 0) {\n        echo \"   ⚠️ $orphaned textes orphelins détectés\\n\";\n        \n        // Essayer de récupérer les textes orphelins par nom/prénom\n        $stmt = $db->query(\"\n            SELECT t.id, t.prenom, t.nom, t.titre, u.id as user_id\n            FROM cp2i_textes t\n            LEFT JOIN cp2i_users u ON t.prenom = u.prenom AND t.nom = u.nom AND u.role = 'participant'\n            WHERE t.participant_id NOT IN (SELECT id FROM cp2i_users)\n            AND u.id IS NOT NULL\n        \");\n        \n        $recovered = 0;\n        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {\n            $updateStmt = $db->prepare(\"UPDATE cp2i_textes SET participant_id = ? WHERE id = ?\");\n            $updateStmt->execute([$row['user_id'], $row['id']]);\n            $recovered++;\n        }\n        \n        if ($recovered > 0) {\n            echo \"   ✅ $recovered textes orphelins récupérés\\n\";\n        }\n        \n        // Supprimer les textes vraiment orphelins\n        $stmt = $db->prepare(\"\n            DELETE FROM cp2i_textes \n            WHERE participant_id NOT IN (SELECT id FROM cp2i_users)\n        \");\n        $stmt->execute();\n        $deleted = $stmt->rowCount();\n        \n        if ($deleted > 0) {\n            echo \"   🗑️ $deleted textes orphelins supprimés\\n\";\n        }\n    } else {\n        echo \"   ✅ Aucun texte orphelin\\n\";\n    }\n    \n    // 9. STATISTIQUES FINALES\n    echo \"\\n9. Statistiques finales après correction...\\n\";\n    \n    $stmt = $db->query(\"\n        SELECT \n            COUNT(*) as total_textes,\n            COUNT(CASE WHEN note IS NOT NULL AND note > 0 THEN 1 END) as textes_avec_notes,\n            COUNT(CASE WHEN statut = 'accepte' THEN 1 END) as textes_acceptes,\n            COUNT(CASE WHEN statut = 'refuse' THEN 1 END) as textes_refuses,\n            COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as textes_en_attente,\n            AVG(CASE WHEN note IS NOT NULL AND note > 0 THEN note END) as note_moyenne_finale\n        FROM cp2i_textes\n    \");\n    $finalStats = $stmt->fetch(PDO::FETCH_ASSOC);\n    \n    echo \"   📊 RÉSULTATS FINAUX:\\n\";\n    echo \"     - Total textes: {$finalStats['total_textes']}\\n\";\n    echo \"     - Textes avec notes: {$finalStats['textes_avec_notes']}\\n\";\n    echo \"     - Textes acceptés: {$finalStats['textes_acceptes']}\\n\";\n    echo \"     - Textes refusés: {$finalStats['textes_refuses']}\\n\";\n    echo \"     - Textes en attente: {$finalStats['textes_en_attente']}\\n\";\n    echo \"     - Note moyenne finale: \" . ($finalStats['note_moyenne_finale'] ? round($finalStats['note_moyenne_finale'], 2) . '/20' : 'N/A') . \"\\n\";\n    \n    // 10. VÉRIFICATION DE L'API GET-EVALUATIONS\n    echo \"\\n10. Test de l'API get-evaluations...\\n\";\n    \n    // Tester avec un utilisateur qui a des textes\n    $stmt = $db->query(\"\n        SELECT u.id, u.prenom, u.nom, COUNT(t.id) as nb_textes\n        FROM cp2i_users u\n        JOIN cp2i_textes t ON u.id = t.participant_id\n        WHERE u.role = 'participant'\n        GROUP BY u.id\n        HAVING nb_textes > 0\n        ORDER BY nb_textes DESC\n        LIMIT 1\n    \");\n    \n    if ($testUser = $stmt->fetch(PDO::FETCH_ASSOC)) {\n        echo \"   Test avec utilisateur: {$testUser['prenom']} {$testUser['nom']} (ID: {$testUser['id']})\\n\";\n        \n        // Simuler l'appel API\n        $stmt = $db->prepare(\"\n            SELECT \n                t.id as texte_id,\n                t.titre,\n                t.note,\n                t.statut,\n                COUNT(e.id) as nb_evaluations\n            FROM cp2i_textes t\n            LEFT JOIN cp2i_evaluations e ON t.id = e.texte_id\n            WHERE t.participant_id = ?\n            GROUP BY t.id\n        \");\n        $stmt->execute([$testUser['id']]);\n        \n        echo \"   Textes trouvés pour cet utilisateur:\\n\";\n        while ($texte = $stmt->fetch(PDO::FETCH_ASSOC)) {\n            $note = $texte['note'] ? $texte['note'] . '/20' : 'N/A';\n            echo \"     - {$texte['titre']}: $note ({$texte['nb_evaluations']} évaluations)\\n\";\n        }\n    }\n    \n    echo \"\\n✅ CORRECTION DU POSITIONNEMENT DES NOTES TERMINÉE AVEC SUCCÈS!\\n\";\n    echo \"Les notes officielles sont maintenant correctement positionnées et synchronisées.\\n\";\n    \n} catch (Exception $e) {\n    echo \"❌ Erreur: \" . $e->getMessage() . \"\\n\";\n    echo \"Trace: \" . $e->getTraceAsString() . \"\\n\";\n}\n?>"