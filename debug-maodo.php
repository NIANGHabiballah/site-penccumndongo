<?php
require_once 'src/app/back-end/config.php';

$db = getDB();

// Trouver l'ID de Maodo SIBY
$stmt = $db->prepare("SELECT id FROM cp2i_users WHERE email = 'sibymaodo0@gmail.com'");
$stmt->execute();
$maodo = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$maodo) {
    echo "Utilisateur non trouvé\n";
    exit;
}

$maodo_id = $maodo['id'];
echo "ID Maodo: $maodo_id\n\n";

// Vérifier les affectations
$stmt = $db->prepare("SELECT COUNT(*) as count FROM cp2i_affectations WHERE corrector_id = ?");
$stmt->execute([$maodo_id]);
$assignes = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
echo "Textes assignés: $assignes\n";

// Vérifier les évaluations
$stmt = $db->prepare("SELECT COUNT(*) as count FROM cp2i_evaluations WHERE correcteur_id = ?");
$stmt->execute([$maodo_id]);
$corriges = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
echo "Textes corrigés: $corriges\n";

echo "En attente: " . ($assignes - $corriges) . "\n\n";

// Détail des textes assignés
echo "=== TEXTES ASSIGNÉS ===\n";
$stmt = $db->prepare("
    SELECT t.id, t.titre 
    FROM cp2i_affectations a 
    JOIN cp2i_textes t ON a.texte_id = t.id 
    WHERE a.corrector_id = ?
");
$stmt->execute([$maodo_id]);
$textes_assignes = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($textes_assignes as $texte) {
    echo "- Texte {$texte['id']}: {$texte['titre']}\n";
}

// Détail des évaluations
echo "\n=== ÉVALUATIONS FAITES ===\n";
$stmt = $db->prepare("
    SELECT e.texte_id, t.titre, e.note_totale 
    FROM cp2i_evaluations e 
    JOIN cp2i_textes t ON e.texte_id = t.id 
    WHERE e.correcteur_id = ?
");
$stmt->execute([$maodo_id]);
$evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($evaluations as $eval) {
    echo "- Texte {$eval['texte_id']}: {$eval['titre']} (Note: {$eval['note_totale']})\n";
}
?>