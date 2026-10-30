<?php
// SCRIPT DE MIGRATION - SUPPRIMER APRÈS UTILISATION
// Accès sécurisé par clé secrète
$secret = $_GET['key'] ?? '';
if ($secret !== 'cp2i_migration_2026') {
    die('Accès refusé');
}

require_once 'config.php';
$db = getDB();

$steps = [];

try {
    // 1. Créer la table cp2i_editions
    $db->exec("
        CREATE TABLE IF NOT EXISTS cp2i_editions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            numero INT NOT NULL,
            annee INT NOT NULL,
            label VARCHAR(100) NOT NULL,
            is_active BOOLEAN DEFAULT FALSE,
            date_debut DATE NULL,
            date_fin DATE NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_numero (numero)
        )
    ");
    $steps[] = ['ok', 'Table cp2i_editions créée'];

    // 2. Insérer les deux éditions
    $db->exec("
        INSERT IGNORE INTO cp2i_editions (numero, annee, label, is_active, date_debut, date_fin) VALUES
        (3, 2025, '3ᵉ édition (2025)', FALSE, '2025-11-03', '2025-12-10'),
        (4, 2026, '4ᵉ édition (2026)', TRUE,  '2026-11-03', '2026-12-10')
    ");
    $steps[] = ['ok', 'Éditions 3 et 4 insérées'];

    // 3. Ajouter edition_id dans cp2i_textes (si pas déjà présente)
    $cols = $db->query("SHOW COLUMNS FROM cp2i_textes LIKE 'edition_id'")->fetchAll();
    if (empty($cols)) {
        $db->exec("ALTER TABLE cp2i_textes ADD COLUMN edition_id INT NOT NULL DEFAULT 4");
        $steps[] = ['ok', 'Colonne edition_id ajoutée dans cp2i_textes'];
    } else {
        $steps[] = ['info', 'Colonne edition_id déjà présente'];
    }

    // 4. Rattacher les anciens textes à l'édition 3
    $updated = $db->exec("UPDATE cp2i_textes SET edition_id = 3 WHERE created_at < '2026-01-01' AND edition_id = 4");
    $steps[] = ['ok', "$updated texte(s) rattaché(s) à l'édition 3 (2025)"];

    // 5. Ajouter la clé étrangère (si pas déjà présente)
    $fks = $db->query("
        SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_NAME = 'cp2i_textes'
        AND COLUMN_NAME = 'edition_id'
        AND REFERENCED_TABLE_NAME = 'cp2i_editions'
    ")->fetchAll();
    if (empty($fks)) {
        $db->exec("ALTER TABLE cp2i_textes ADD CONSTRAINT fk_textes_edition FOREIGN KEY (edition_id) REFERENCES cp2i_editions(id)");
        $steps[] = ['ok', 'Clé étrangère fk_textes_edition ajoutée'];
    } else {
        $steps[] = ['info', 'Clé étrangère déjà présente'];
    }

    // 6. Créer l'index
    $indexes = $db->query("SHOW INDEX FROM cp2i_textes WHERE Key_name = 'idx_cp2i_textes_edition'")->fetchAll();
    if (empty($indexes)) {
        $db->exec("CREATE INDEX idx_cp2i_textes_edition ON cp2i_textes(edition_id)");
        $steps[] = ['ok', 'Index idx_cp2i_textes_edition créé'];
    } else {
        $steps[] = ['info', 'Index déjà présent'];
    }

    // Vérification finale
    $editions = $db->query("SELECT * FROM cp2i_editions ORDER BY numero")->fetchAll(PDO::FETCH_ASSOC);
    $counts = $db->query("SELECT edition_id, COUNT(*) as total FROM cp2i_textes GROUP BY edition_id")->fetchAll(PDO::FETCH_ASSOC);

} catch (Exception $e) {
    $steps[] = ['error', 'ERREUR : ' . $e->getMessage()];
}
?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Migration CP2i Multi-Éditions</title>
  <style>
    body { font-family: sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; }
    h2 { color: #0380C2; }
    .step { padding: 8px 12px; margin: 6px 0; border-radius: 6px; display: flex; gap: 10px; align-items: center; }
    .ok   { background: #d4edda; color: #155724; }
    .info { background: #d1ecf1; color: #0c5460; }
    .error{ background: #f8d7da; color: #721c24; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #dee2e6; padding: 8px 12px; text-align: left; }
    th { background: #0380C2; color: white; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 6px; margin-top: 20px; color: #856404; }
  </style>
</head>
<body>
  <h2>Migration CP2i — Système Multi-Éditions</h2>

  <h3>Étapes exécutées :</h3>
  <?php foreach ($steps as [$type, $msg]): ?>
    <div class="step <?= $type ?>">
      <?= $type === 'ok' ? '✅' : ($type === 'error' ? '❌' : 'ℹ️') ?>
      <?= htmlspecialchars($msg) ?>
    </div>
  <?php endforeach; ?>

  <?php if (!empty($editions)): ?>
    <h3>Éditions en base :</h3>
    <table>
      <tr><th>ID</th><th>Numéro</th><th>Label</th><th>Active</th><th>Début</th><th>Fin</th></tr>
      <?php foreach ($editions as $ed): ?>
        <tr>
          <td><?= $ed['id'] ?></td>
          <td><?= $ed['numero'] ?></td>
          <td><?= htmlspecialchars($ed['label']) ?></td>
          <td><?= $ed['is_active'] ? '✅ Oui' : 'Non' ?></td>
          <td><?= $ed['date_debut'] ?></td>
          <td><?= $ed['date_fin'] ?></td>
        </tr>
      <?php endforeach; ?>
    </table>
  <?php endif; ?>

  <?php if (!empty($counts)): ?>
    <h3>Textes par édition :</h3>
    <table>
      <tr><th>edition_id</th><th>Nombre de textes</th></tr>
      <?php foreach ($counts as $c): ?>
        <tr><td><?= $c['edition_id'] ?></td><td><?= $c['total'] ?></td></tr>
      <?php endforeach; ?>
    </table>
  <?php endif; ?>

  <div class="warning">
    ⚠️ <strong>Supprime ce fichier du serveur après utilisation !</strong><br>
    Il ne doit pas rester accessible en production.
  </div>
</body>
</html>
