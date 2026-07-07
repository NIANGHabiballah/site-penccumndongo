<?php
// Script de test pour vérifier les statistiques réelles de la base de données
require_once 'src/app/back-end/config.php';

echo "=== TEST DES STATISTIQUES RÉELLES CP2i ===\n\n";

try {
    $db = getDB();
    echo "✅ Connexion à la base de données réussie\n\n";
    
    // 1. Statistiques générales des textes
    echo "📊 STATISTIQUES GÉNÉRALES DES TEXTES:\n";
    $stmt = $db->prepare("
        SELECT 
            COUNT(*) as total_textes,
            SUM(CASE WHEN statut = 'accepte' THEN 1 ELSE 0 END) as textes_acceptes,
            SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END) as textes_refuses,
            SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as textes_en_attente,
            AVG(CASE WHEN note IS NOT NULL THEN note END) as note_moyenne
        FROM cp2i_textes
    ");
    $stmt->execute();
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "- Total textes: " . $stats['total_textes'] . "\n";
    echo "- Textes acceptés: " . $stats['textes_acceptes'] . "\n";
    echo "- Textes refusés: " . $stats['textes_refuses'] . "\n";
    echo "- Textes en attente: " . $stats['textes_en_attente'] . "\n";
    echo "- Note moyenne: " . ($stats['note_moyenne'] ? number_format($stats['note_moyenne'], 2) . "/20" : "N/A") . "\n\n";
    
    // 2. Détail des textes
    echo "📝 DÉTAIL DES TEXTES:\n";
    $stmt = $db->prepare("
        SELECT 
            t.id,
            t.titre,
            t.statut,
            t.note,
            CONCAT(u.prenom, ' ', u.nom) as auteur,
            t.created_at
        FROM cp2i_textes t
        JOIN cp2i_users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
        LIMIT 10
    ");
    $stmt->execute();
    $textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($textes)) {
        echo "❌ Aucun texte trouvé dans la base de données\n\n";
    } else {
        foreach ($textes as $texte) {
            echo "- ID: {$texte['id']} | Titre: {$texte['titre']} | Auteur: {$texte['auteur']} | Statut: {$texte['statut']} | Note: " . ($texte['note'] ?? 'N/A') . "\n";
        }
        echo "\n";
    }
    
    // 3. Statistiques des utilisateurs
    echo "👥 STATISTIQUES DES UTILISATEURS:\n";
    $stmt = $db->prepare("
        SELECT 
            role,
            COUNT(*) as nombre
        FROM cp2i_users 
        GROUP BY role
    ");
    $stmt->execute();
    $users_stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($users_stats as $stat) {
        echo "- " . ucfirst($stat['role']) . "s: " . $stat['nombre'] . "\n";
    }
    echo "\n";
    
    // 4. Affectations
    echo "🔗 STATISTIQUES D'AFFECTATIONS:\n";
    $stmt = $db->prepare("
        SELECT 
            t.id as texte_id,
            t.titre,
            u.prenom as auteur_prenom,
            u.nom as auteur_nom,
            COUNT(a.corrector_id) as nb_correcteurs,
            GROUP_CONCAT(CONCAT(c.prenom, ' ', c.nom) SEPARATOR ', ') as correcteurs_noms
        FROM cp2i_textes t
        JOIN cp2i_users u ON t.user_id = u.id
        LEFT JOIN cp2i_affectations a ON t.id = a.texte_id
        LEFT JOIN cp2i_users c ON a.corrector_id = c.id
        GROUP BY t.id, t.titre, u.prenom, u.nom
        ORDER BY nb_correcteurs DESC
        LIMIT 10
    ");
    $stmt->execute();
    $affectations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($affectations)) {
        echo "❌ Aucune affectation trouvée\n\n";
    } else {
        foreach ($affectations as $aff) {
            echo "- Texte: {$aff['titre']} | Auteur: {$aff['auteur_prenom']} {$aff['auteur_nom']} | Correcteurs: {$aff['nb_correcteurs']}/3";
            if ($aff['correcteurs_noms']) {
                echo " ({$aff['correcteurs_noms']})";
            }
            echo "\n";
        }
        echo "\n";
    }
    
    // 5. Test de la structure des tables
    echo "🗄️ VÉRIFICATION DES TABLES:\n";
    $tables = ['cp2i_users', 'cp2i_textes', 'cp2i_affectations'];
    
    foreach ($tables as $table) {
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM $table");
        $stmt->execute();
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        echo "- Table $table: $count enregistrements\n";
    }
    
    echo "\n✅ Test terminé avec succès!\n";
    echo "Les données sont maintenant récupérées directement de la base de données.\n";
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo "Vérifiez la configuration de la base de données dans config.php\n";
}
?>