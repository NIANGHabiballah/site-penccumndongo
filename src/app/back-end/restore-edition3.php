<?php
require_once 'config.php';
$db = getDB();

try {
    // Affectations manquantes pour l'édition 3 uniquement
    $stmt = $db->prepare("
        SELECT DISTINCT e.texte_id, e.correcteur_id
        FROM cp2i_evaluations e
        JOIN cp2i_textes t ON e.texte_id = t.id AND t.edition_id = 3
        JOIN cp2i_users u ON e.correcteur_id = u.id AND u.role = 'correcteur'
        LEFT JOIN cp2i_affectations a ON a.texte_id = e.texte_id AND a.corrector_id = e.correcteur_id
        WHERE a.id IS NULL
    ");
    $stmt->execute();
    $manquantes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $restored = 0;
    foreach ($manquantes as $row) {
        $ins = $db->prepare("INSERT INTO cp2i_affectations (texte_id, corrector_id, created_at) VALUES (?, ?, NOW())");
        $ins->execute([$row['texte_id'], $row['correcteur_id']]);
        $restored++;
    }

    $stmt = $db->prepare("SELECT COUNT(*) FROM cp2i_affectations a JOIN cp2i_textes t ON a.texte_id = t.id WHERE t.edition_id = 3");
    $stmt->execute();
    $total = $stmt->fetchColumn();

    echo "<h2>✅ Restauration édition 3 terminée</h2>";
    echo "<p><strong>$restored</strong> affectations restaurées.</p>";
    echo "<p>Total affectations édition 3 en base : <strong>$total</strong></p>";
    echo "<p style='color:red;font-weight:bold'>⚠️ Supprime ce fichier du serveur maintenant !</p>";

} catch (Exception $e) {
    echo "<h2>❌ Erreur</h2><p>" . $e->getMessage() . "</p>";
}
?>
