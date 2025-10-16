<?php
require_once 'config.php';

$db = getDB();

echo "=== Test des affectations ===\n\n";

// Vérifier les textes
$stmt = $db->prepare("SELECT COUNT(*) as count FROM cp2i_textes");
$stmt->execute();
$textes_count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
echo "Nombre de textes: $textes_count\n";

// Vérifier les affectations
$stmt = $db->prepare("SELECT COUNT(*) as count FROM cp2i_affectations");
$stmt->execute();
$affectations_count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
echo "Nombre d'affectations: $affectations_count\n\n";

// Test de la requête exacte
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
    GROUP BY t.id
    ORDER BY nb_correcteurs DESC, t.titre
");
$stmt->execute();
$result = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Résultat de la requête:\n";
echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>