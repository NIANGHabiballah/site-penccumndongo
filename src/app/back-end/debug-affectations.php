<?php
require_once 'config.php';
setContentType('application/json');

$db = getDB();

echo "=== DEBUG AFFECTATIONS ===\n\n";

// 1. Vérifier la structure de la table cp2i_affectations
echo "1. Structure de la table cp2i_affectations:\n";
try {
    $stmt = $db->query("DESCRIBE cp2i_affectations");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "   - {$col['Field']} ({$col['Type']})\n";
    }
} catch (Exception $e) {
    echo "   Erreur: " . $e->getMessage() . "\n";
}

// 2. Contenu actuel de la table
echo "\n2. Contenu de cp2i_affectations:\n";
try {
    $stmt = $db->query("SELECT * FROM cp2i_affectations");
    $affectations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "   Nombre d'affectations: " . count($affectations) . "\n";
    foreach ($affectations as $aff) {
        echo "   - ID: {$aff['id']}, Participant: {$aff['participant_id']}, Correcteur: {$aff['corrector_id']}\n";
    }
} catch (Exception $e) {
    echo "   Erreur: " . $e->getMessage() . "\n";
}

// 3. Tester la requête des affectations avec noms
echo "\n3. Affectations avec noms complets:\n";
try {
    $stmt = $db->prepare("
        SELECT a.id as affectation_id,
               a.participant_id, 
               a.corrector_id,
               CONCAT(p.prenom, ' ', p.nom) as participant_nom_complet,
               CONCAT(c.prenom, ' ', c.nom) as correcteur_nom_complet,
               p.email as participant_email,
               c.email as correcteur_email,
               a.created_at as date_affectation
        FROM cp2i_affectations a
        JOIN cp2i_users p ON a.participant_id = p.id
        JOIN cp2i_users c ON a.corrector_id = c.id
        ORDER BY a.created_at DESC
    ");
    $stmt->execute();
    $affectations_avec_noms = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "   Nombre d'affectations avec noms: " . count($affectations_avec_noms) . "\n";
    foreach ($affectations_avec_noms as $aff) {
        echo "   - {$aff['participant_nom_complet']} → {$aff['correcteur_nom_complet']}\n";
    }
} catch (Exception $e) {
    echo "   Erreur: " . $e->getMessage() . "\n";
}

// 4. Tester la requête des textes avec affectations
echo "\n4. Textes avec leurs affectations:\n";
try {
    $stmt = $db->prepare("
        SELECT 
            t.id as texte_id,
            t.titre,
            t.statut,
            CONCAT(u.prenom, ' ', u.nom) as auteur_nom_complet,
            u.email as auteur_email,
            COALESCE(COUNT(CASE WHEN a.corrector_id IS NOT NULL THEN 1 END), 0) as nb_correcteurs,
            GROUP_CONCAT(CONCAT(c.prenom, ' ', c.nom) SEPARATOR ', ') as correcteurs_noms,
            t.created_at as date_soumission
        FROM cp2i_textes t
        JOIN cp2i_users u ON t.user_id = u.id
        LEFT JOIN cp2i_affectations a ON u.id = a.participant_id
        LEFT JOIN cp2i_users c ON a.corrector_id = c.id AND c.role = 'correcteur'
        GROUP BY t.id, t.titre, t.statut, u.prenom, u.nom, u.email, t.created_at
        ORDER BY nb_correcteurs DESC, t.titre
    ");
    $stmt->execute();
    $textes_affectations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "   Nombre de textes: " . count($textes_affectations) . "\n";
    foreach ($textes_affectations as $texte) {
        echo "   - '{$texte['titre']}' par {$texte['auteur_nom_complet']} → {$texte['nb_correcteurs']} correcteurs";
        if ($texte['correcteurs_noms']) {
            echo " ({$texte['correcteurs_noms']})";
        }
        echo "\n";
    }
} catch (Exception $e) {
    echo "   Erreur: " . $e->getMessage() . "\n";
}

echo "\n=== FIN DEBUG ===\n";
?>