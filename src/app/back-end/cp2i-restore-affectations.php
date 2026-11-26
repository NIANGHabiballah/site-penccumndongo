<?php
require_once 'config.php';
setCorsHeaders();

$user = verifyToken();
if ($user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

$db = getDB();

try {
    // Récupérer tous les couples (texte_id, correcteur_id) depuis cp2i_evaluations
    // qui n'ont pas encore d'affectation dans cp2i_affectations
    $stmt = $db->prepare("
        SELECT DISTINCT e.texte_id, e.correcteur_id
        FROM cp2i_evaluations e
        JOIN cp2i_textes t ON e.texte_id = t.id
        JOIN cp2i_users u ON e.correcteur_id = u.id AND u.role = 'correcteur'
        LEFT JOIN cp2i_affectations a ON a.texte_id = e.texte_id AND a.corrector_id = e.correcteur_id
        WHERE a.id IS NULL
    ");
    $stmt->execute();
    $manquantes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $restored = 0;
    $errors = 0;

    foreach ($manquantes as $row) {
        try {
            $ins = $db->prepare("
                INSERT INTO cp2i_affectations (texte_id, corrector_id, created_at)
                VALUES (?, ?, NOW())
            ");
            $ins->execute([$row['texte_id'], $row['correcteur_id']]);
            $restored++;
        } catch (Exception $e) {
            $errors++;
        }
    }

    // Stats après restauration
    $stmt = $db->prepare("SELECT COUNT(*) FROM cp2i_affectations");
    $stmt->execute();
    $total = $stmt->fetchColumn();

    echo json_encode([
        'success'  => true,
        'restored' => $restored,
        'errors'   => $errors,
        'total_affectations' => $total,
        'message'  => "$restored affectations restaurées depuis les évaluations existantes"
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
