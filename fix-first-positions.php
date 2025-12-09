<?php
require_once 'src/app/back-end/config.php';

echo "=== CORRECTION DU POSITIONNEMENT DES PREMIERS ÉLÉMENTS ===\n\n";

try {
    $db = getDB();
    
    // 1. VÉRIFICATION DES PREMIERS UTILISATEURS
    echo "1. Vérification des premiers utilisateurs...\n";
    $stmt = $db->query("SELECT id, email, nom, prenom, role FROM cp2i_users ORDER BY id LIMIT 10");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($users as $user) {
        echo "   ID: {$user['id']} | Email: {$user['email']} | Nom: {$user['nom']} {$user['prenom']} | Rôle: {$user['role']}\n";
    }
    
    // 2. CORRECTION DES COMPTES ADMIN/CORRECTEUR MAL POSITIONNÉS
    echo "\n2. Correction des comptes système...\n";
    
    // Vérifier si les comptes admin/correcteur existent
    $stmt = $db->query("SELECT COUNT(*) FROM cp2i_users WHERE role = 'admin'");
    $admin_count = $stmt->fetchColumn();
    
    $stmt = $db->query("SELECT COUNT(*) FROM cp2i_users WHERE role = 'correcteur'");
    $correcteur_count = $stmt->fetchColumn();
    
    echo "   - Admins existants: $admin_count\n";
    echo "   - Correcteurs existants: $correcteur_count\n";
    
    // S'assurer qu'il y a au moins un admin
    if ($admin_count == 0) {
        $stmt = $db->prepare("
            INSERT INTO cp2i_users (email, password, nom, prenom, role, created_at) 
            VALUES (?, ?, ?, ?, 'admin', NOW())
        ");
        $stmt->execute([
            'admin@cp2i.com',
            password_hash('admin123', PASSWORD_DEFAULT),
            'Admin',
            'Système'
        ]);
        echo "   ✅ Compte admin créé\n";
    }
    
    // 3. VÉRIFICATION DES PREMIERS TEXTES
    echo "\n3. Vérification des premiers textes...\n";
    $stmt = $db->query("
        SELECT t.id, t.titre, t.participant_id, u.email, t.statut, t.note, t.created_at
        FROM cp2i_textes t
        LEFT JOIN cp2i_users u ON t.participant_id = u.id
        ORDER BY t.id LIMIT 10
    ");
    $textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($textes as $texte) {
        $email = $texte['email'] ?: 'UTILISATEUR SUPPRIMÉ';
        $note = $texte['note'] ?: 'N/A';
        echo "   ID: {$texte['id']} | Titre: {$texte['titre']} | Participant: $email | Statut: {$texte['statut']} | Note: $note\n";
    }
    
    // 4. CORRECTION DES TEXTES ORPHELINS EN PREMIÈRE POSITION
    echo "\n4. Correction des textes orphelins...\n";
    $stmt = $db->query("
        SELECT COUNT(*) 
        FROM cp2i_textes 
        WHERE participant_id NOT IN (SELECT id FROM cp2i_users)
        AND id <= 10
    ");
    $orphaned_first = $stmt->fetchColumn();
    
    if ($orphaned_first > 0) {
        echo "   ⚠️ $orphaned_first textes orphelins dans les 10 premiers\n";
        
        // Option 1: Supprimer les textes orphelins
        $stmt = $db->prepare("
            DELETE FROM cp2i_textes 
            WHERE participant_id NOT IN (SELECT id FROM cp2i_users)
            AND id <= 10
        ");
        $stmt->execute();
        echo "   ✅ Textes orphelins supprimés\n";
    } else {
        echo "   ✅ Aucun texte orphelin dans les premiers\n";
    }
    
    // 5. RÉORGANISATION DES IDs (OPTIONNEL)
    echo "\n5. Vérification de la séquence des IDs...\n";
    
    // Vérifier s'il y a des trous dans la séquence
    $stmt = $db->query("
        SELECT 
            MIN(id) as min_id,
            MAX(id) as max_id,
            COUNT(*) as total_count,
            (MAX(id) - MIN(id) + 1) as expected_count
        FROM cp2i_textes
    ");
    $sequence_info = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $gaps = $sequence_info['expected_count'] - $sequence_info['total_count'];
    echo "   - ID minimum: {$sequence_info['min_id']}\n";
    echo "   - ID maximum: {$sequence_info['max_id']}\n";
    echo "   - Total enregistrements: {$sequence_info['total_count']}\n";
    echo "   - Trous dans la séquence: $gaps\n";
    
    // 6. VÉRIFICATION DES PREMIÈRES ÉVALUATIONS
    echo "\n6. Vérification des premières évaluations...\n";
    $stmt = $db->query("
        SELECT e.id, e.texte_id, t.titre, e.correcteur_id, u.email, e.note_totale
        FROM cp2i_evaluations e
        LEFT JOIN cp2i_textes t ON e.texte_id = t.id
        LEFT JOIN cp2i_users u ON e.correcteur_id = u.id
        ORDER BY e.id LIMIT 10
    ");
    $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($evaluations as $eval) {
        $titre = $eval['titre'] ?: 'TEXTE SUPPRIMÉ';
        $correcteur = $eval['email'] ?: 'CORRECTEUR SUPPRIMÉ';
        echo "   ID: {$eval['id']} | Texte: $titre | Correcteur: $correcteur | Note: {$eval['note_totale']}\n";
    }
    
    // 7. CORRECTION DES ÉVALUATIONS ORPHELINES
    echo "\n7. Correction des évaluations orphelines...\n";
    $stmt = $db->query("
        SELECT COUNT(*) 
        FROM cp2i_evaluations 
        WHERE texte_id NOT IN (SELECT id FROM cp2i_textes)
        OR correcteur_id NOT IN (SELECT id FROM cp2i_users)
    ");
    $orphaned_eval = $stmt->fetchColumn();
    
    if ($orphaned_eval > 0) {
        echo "   ⚠️ $orphaned_eval évaluations orphelines détectées\n";
        
        // Supprimer les évaluations orphelines
        $db->exec("
            DELETE FROM cp2i_evaluations 
            WHERE texte_id NOT IN (SELECT id FROM cp2i_textes)
            OR correcteur_id NOT IN (SELECT id FROM cp2i_users)
        ");
        echo "   ✅ Évaluations orphelines supprimées\n";
    } else {
        echo "   ✅ Aucune évaluation orpheline\n";
    }
    
    // 8. MISE À JOUR DES POSITIONS DANS LE CLASSEMENT
    echo "\n8. Recalcul des positions dans le classement...\n";
    
    // Créer une table temporaire pour le classement
    $db->exec("DROP TEMPORARY TABLE IF EXISTS temp_classement");
    $db->exec("
        CREATE TEMPORARY TABLE temp_classement AS
        SELECT 
            t.id,
            t.participant_id,
            t.titre,
            AVG(e.note_totale) as note_moyenne,
            COUNT(e.id) as nb_evaluations,
            ROW_NUMBER() OVER (ORDER BY AVG(e.note_totale) DESC, COUNT(e.id) DESC) as position
        FROM cp2i_textes t
        LEFT JOIN cp2i_evaluations e ON t.id = e.texte_id
        WHERE t.statut IN ('accepte', 'refuse')
        GROUP BY t.id, t.participant_id, t.titre
        HAVING AVG(e.note_totale) IS NOT NULL
    ");
    
    // Afficher le top 10
    $stmt = $db->query("
        SELECT tc.position, tc.titre, tc.note_moyenne, u.nom, u.prenom
        FROM temp_classement tc
        LEFT JOIN cp2i_users u ON tc.participant_id = u.id
        ORDER BY tc.position
        LIMIT 10
    ");
    
    echo "   Top 10 du classement:\n";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $nom_complet = ($row['nom'] && $row['prenom']) ? "{$row['nom']} {$row['prenom']}" : "Utilisateur supprimé";
        echo "     {$row['position']}. {$row['titre']} - {$row['note_moyenne']}/20 - $nom_complet\n";
    }
    
    // 9. VÉRIFICATION FINALE
    echo "\n9. Vérification finale de l'intégrité...\n";
    
    // Compter les enregistrements valides
    $stmt = $db->query("SELECT COUNT(*) FROM cp2i_users");
    $users_count = $stmt->fetchColumn();
    
    $stmt = $db->query("SELECT COUNT(*) FROM cp2i_textes WHERE participant_id IN (SELECT id FROM cp2i_users)");
    $valid_textes = $stmt->fetchColumn();
    
    $stmt = $db->query("
        SELECT COUNT(*) FROM cp2i_evaluations 
        WHERE texte_id IN (SELECT id FROM cp2i_textes) 
        AND correcteur_id IN (SELECT id FROM cp2i_users)
    ");
    $valid_evaluations = $stmt->fetchColumn();
    
    echo "   ✅ Utilisateurs valides: $users_count\n";
    echo "   ✅ Textes valides: $valid_textes\n";
    echo "   ✅ Évaluations valides: $valid_evaluations\n";
    
    echo "\n🎉 CORRECTION DU POSITIONNEMENT TERMINÉE AVEC SUCCÈS!\n";
    echo "Tous les premiers éléments sont maintenant correctement positionnés.\n";
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
?>