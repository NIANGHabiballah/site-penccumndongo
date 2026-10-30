<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$user = verifyToken();

switch ($method) {
    case 'GET':
        $action = $_GET['action'] ?? 'list';
        if ($action === 'active') {
            getActiveEdition();
        } else {
            getEditionsForUser($user);
        }
        break;
}

// Retourne toutes les éditions auxquelles le participant a participé
function getEditionsForUser($user) {
    $db = getDB();

    if ($user['role'] === 'admin' || $user['role'] === 'correcteur') {
        $stmt = $db->prepare("SELECT * FROM cp2i_editions ORDER BY numero ASC");
        $stmt->execute();
    } else {
        // Participant : éditions où il a soumis (via numero) + édition active
        $stmt = $db->prepare("
            SELECT DISTINCT e.*
            FROM cp2i_editions e
            WHERE e.is_active = TRUE
               OR e.numero IN (
                   SELECT DISTINCT t.edition_id
                   FROM cp2i_textes t
                   WHERE t.user_id = ?
               )
            ORDER BY e.numero ASC
        ");
        $stmt->execute([$user['user_id']]);
    }

    $editions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // Ajouter edition_ref = numero pour que le frontend utilise le bon identifiant
    foreach ($editions as &$ed) {
        $ed['edition_ref'] = (int)$ed['numero'];
    }
    echo json_encode(['success' => true, 'editions' => $editions]);
}

function getActiveEdition() {
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM cp2i_editions WHERE is_active = TRUE LIMIT 1");
    $stmt->execute();
    $edition = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'edition' => $edition]);
}
?>
