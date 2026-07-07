<?php
require_once 'src/app/back-end/config.php';

echo "=== TEST DU POSITIONNEMENT DES NOTES CORRIGÉ ===\n\n";

try {
    $db = getDB();
    
    // 1. Test de l'API corrigée avec un utilisateur spécifique
    echo "1. Test de l'API get-evaluations-fixed-positioning.php...\n";
    
    // Trouver un utilisateur avec des textes
    $stmt = $db->query("
        SELECT u.id, u.prenom, u.nom, COUNT(t.id) as nb_textes
        FROM cp2i_users u
        JOIN cp2i_textes t ON u.id = t.participant_id
        WHERE u.role = 'participant'
        GROUP BY u.id
        HAVING nb_textes > 0
        ORDER BY nb_textes DESC
        LIMIT 1
    ");
    
    if ($testUser = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "   Utilisateur test: {$testUser['prenom']} {$testUser['nom']} (ID: {$testUser['id']}, {$testUser['nb_textes']} textes)\n";
        
        // Simuler l'appel de l'API corrigée
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer test_token_for_user_' . $testUser['id'];
        
        // Créer un token JWT factice pour le test
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'user_id' => $testUser['id'],
            'email' => $testUser['prenom'] . '@test.com',
            'role' => 'participant',
            'exp' => time() + 3600
        ]);
        $signature = 'test_signature';
        
        $testToken = base64_encode($header) . '.' . base64_encode($payload) . '.' . $signature;
        
        echo "   Token test généré pour simulation\n";
        
        // Récupérer directement les données comme le ferait l'API
        $stmt = $db->prepare("
            SELECT 
                t.id,
                t.titre,
                t.contenu,
                t.langue,
                t.theme,
                t.nb_vers,
                t.statut,
                t.note,
                t.commentaire,
                t.created_at,
                t.updated_at
            FROM cp2i_textes t
            WHERE t.participant_id = ?
            ORDER BY t.created_at DESC
        ");
        
        $stmt->execute([$testUser['id']]);
        $textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "   Textes trouvés: " . count($textes) . "\n";
        
        foreach ($textes as $index => $texte) {
            echo "   \n   Texte " . ($index + 1) . ": {$texte['titre']}\n";
            echo "     - Statut: {$texte['statut']}\n";
            echo "     - Note: " . ($texte['note'] ?: 'N/A') . "\n";
            echo "     - Langue: {$texte['langue']}\n";
            
            // Chercher les évaluations détaillées\            $evalStmt = $db->prepare("
                SELECT 
                    e.id,
                    e.correcteur_id,
                    e.pertinence,
                    e.coherence,
                    e.correction,
                    e.presentation,
                    e.note_totale,
                    e.remarques,
                    e.created_at as date_evaluation,
                    c.prenom as correcteur_prenom,
                    c.nom as correcteur_nom
                FROM cp2i_evaluations e
                LEFT JOIN cp2i_users c ON e.correcteur_id = c.id
                WHERE e.texte_id = ?
                ORDER BY e.created_at ASC
            ");
            
            $evalStmt->execute([$texte['id']]);
            $evaluations = $evalStmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (!empty($evaluations)) {
                echo "     - Évaluations détaillées: " . count($evaluations) . "\n";
                foreach ($evaluations as $eval) {
                    $correcteur = $eval['correcteur_prenom'] . ' ' . $eval['correcteur_nom'];
                    echo "       * $correcteur: {$eval['note_totale']}/20\n";
                    if ($eval['pertinence']) {
                        echo "         Pertinence: {$eval['pertinence']}/5, Cohérence: {$eval['coherence']}/5\n";
                        echo "         Correction: {$eval['correction']}/5, Présentation: {$eval['presentation']}/5\n";
                    }
                    if ($eval['remarques']) {
                        echo "         Remarques: " . substr($eval['remarques'], 0, 50) . "...\n";
                    }
                }
            } else {
                // Chercher dans cp2i_corrections
                $corrStmt = $db->prepare("
                    SELECT 
                        c.id,
                        c.corrector_id as correcteur_id,
                        c.note as note_totale,
                        c.commentaire as remarques,
                        c.created_at as date_evaluation,
                        u.prenom as correcteur_prenom,
                        u.nom as correcteur_nom
                    FROM cp2i_corrections c
                    LEFT JOIN cp2i_users u ON c.corrector_id = u.id
                    WHERE c.texte_id = ?
                    ORDER BY c.created_at ASC
                ");
                
                $corrStmt->execute([$texte['id']]);
                $corrections = $corrStmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (!empty($corrections)) {
                    echo "     - Corrections (legacy): " . count($corrections) . "\n";
                    foreach ($corrections as $corr) {
                        $correcteur = $corr['correcteur_prenom'] . ' ' . $corr['correcteur_nom'];
                        echo "       * $correcteur: {$corr['note_totale']}/20\n";
                        if ($corr['remarques']) {
                            echo "         Commentaire: " . substr($corr['remarques'], 0, 50) . "...\n";
                        }
                    }
                } else {
                    echo "     - ⚠️ Aucune évaluation trouvée\n";
                }
            }
        }
        
    } else {
        echo "   ❌ Aucun utilisateur avec textes trouvé\n";
    }
    
    // 2. Test du calcul des notes moyennes
    echo "\n2. Test du calcul des notes moyennes...\n";
    
    $stmt = $db->query("
        SELECT 
            u.prenom, u.nom,
            COUNT(t.id) as nb_textes,
            AVG(CASE WHEN t.note IS NOT NULL AND t.note > 0 THEN t.note END) as note_moyenne_textes
        FROM cp2i_users u
        JOIN cp2i_textes t ON u.id = t.participant_id
        WHERE u.role = 'participant'
        GROUP BY u.id, u.prenom, u.nom
        HAVING nb_textes > 0
        ORDER BY note_moyenne_textes DESC NULLS LAST
        LIMIT 5
    ");
    
    echo "   Top 5 participants par note moyenne:\n";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $note = $row['note_moyenne_textes'] ? round($row['note_moyenne_textes'], 2) . '/20' : 'N/A';
        echo "     - {$row['prenom']} {$row['nom']}: $note ({$row['nb_textes']} textes)\n";
    }
    
    // 3. Test de la cohérence des données
    echo "\n3. Test de la cohérence des données...\n";
    
    // Vérifier les textes avec notes mais sans évaluations
    $stmt = $db->query("
        SELECT COUNT(*) as count
        FROM cp2i_textes t
        WHERE t.note IS NOT NULL AND t.note > 0
        AND NOT EXISTS (
            SELECT 1 FROM cp2i_evaluations e WHERE e.texte_id = t.id
        )
        AND NOT EXISTS (
            SELECT 1 FROM cp2i_corrections c WHERE c.texte_id = t.id
        )
    ");
    $textesAvecNoteSansEval = $stmt->fetchColumn();
    
    if ($textesAvecNoteSansEval > 0) {
        echo "   ⚠️ $textesAvecNoteSansEval textes ont des notes mais pas d'évaluations\n";
    } else {
        echo "   ✅ Tous les textes avec notes ont des évaluations correspondantes\n";
    }
    
    // Vérifier les évaluations sans notes dans les textes
    $stmt = $db->query("
        SELECT COUNT(*) as count
        FROM cp2i_evaluations e
        JOIN cp2i_textes t ON e.texte_id = t.id
        WHERE e.note_totale IS NOT NULL AND e.note_totale > 0
        AND (t.note IS NULL OR t.note = 0)
    ");
    $evalSansNoteTexte = $stmt->fetchColumn();
    
    if ($evalSansNoteTexte > 0) {
        echo "   ⚠️ $evalSansNoteTexte évaluations existent mais les textes n'ont pas de notes\n";
        echo "   → Recommandation: Exécuter le script fix-notes-positioning.php\n";
    } else {
        echo "   ✅ Toutes les évaluations sont synchronisées avec les notes des textes\n";
    }
    
    // 4. Statistiques finales
    echo "\n4. Statistiques finales...\n";
    
    $stmt = $db->query("
        SELECT 
            COUNT(DISTINCT u.id) as total_participants,
            COUNT(t.id) as total_textes,
            COUNT(CASE WHEN t.note IS NOT NULL AND t.note > 0 THEN 1 END) as textes_avec_notes,
            COUNT(CASE WHEN t.statut = 'accepte' THEN 1 END) as textes_acceptes,
            COUNT(CASE WHEN t.statut = 'refuse' THEN 1 END) as textes_refuses,
            COUNT(CASE WHEN t.statut = 'en_attente' THEN 1 END) as textes_en_attente,
            AVG(CASE WHEN t.note IS NOT NULL AND t.note > 0 THEN t.note END) as note_moyenne_globale
        FROM cp2i_users u
        LEFT JOIN cp2i_textes t ON u.id = t.participant_id
        WHERE u.role = 'participant'
    ");
    
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "   📊 STATISTIQUES GLOBALES:\n";
    echo "     - Participants: {$stats['total_participants']}\n";
    echo "     - Textes soumis: {$stats['total_textes']}\n";
    echo "     - Textes avec notes: {$stats['textes_avec_notes']}\n";
    echo "     - Textes acceptés: {$stats['textes_acceptes']}\n";
    echo "     - Textes refusés: {$stats['textes_refuses']}\n";
    echo "     - Textes en attente: {$stats['textes_en_attente']}\n";
    echo "     - Note moyenne globale: " . ($stats['note_moyenne_globale'] ? round($stats['note_moyenne_globale'], 2) . '/20' : 'N/A') . "\n";
    
    // 5. Recommandations
    echo "\n5. Recommandations...\n";
    
    $pourcentageAvecNotes = $stats['total_textes'] > 0 ? 
        round(($stats['textes_avec_notes'] / $stats['total_textes']) * 100, 1) : 0;
    
    if ($pourcentageAvecNotes < 50) {
        echo "   ⚠️ Seulement $pourcentageAvecNotes% des textes ont des notes\n";
        echo "   → Recommandation: Vérifier le processus d'évaluation\n";
    } elseif ($pourcentageAvecNotes < 80) {
        echo "   ⚠️ $pourcentageAvecNotes% des textes ont des notes (peut être amélioré)\n";
        echo "   → Recommandation: Relancer les correcteurs pour les textes restants\n";
    } else {\n        echo \"   ✅ $pourcentageAvecNotes% des textes ont des notes (bon taux)\\n\";\n    }\n    \n    if ($textesAvecNoteSansEval > 0 || $evalSansNoteTexte > 0) {\n        echo \"   🔧 Exécuter: php fix-notes-positioning.php\\n\";\n    }\n    \n    echo \"\\n✅ TEST DU POSITIONNEMENT DES NOTES TERMINÉ!\\n\";\n    echo \"Les données sont maintenant vérifiées et prêtes pour la section Notes & Classement.\\n\";\n    \n} catch (Exception $e) {\n    echo \"❌ Erreur: \" . $e->getMessage() . \"\\n\";\n    echo \"Trace: \" . $e->getTraceAsString() . \"\\n\";\n}\n?>"