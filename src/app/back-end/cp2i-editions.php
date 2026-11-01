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
    case 'PUT':
        if ($user['role'] === 'admin') {
            updateEditionDates($user);
        } else {
            echo json_encode(['success' => false, 'message' => 'Accès refusé']);
        }
        break;
}

function getEditionsForUser($user) {
    $db = getDB();

    if ($user['role'] === 'admin' || $user['role'] === 'correcteur') {
        $stmt = $db->prepare("SELECT * FROM cp2i_editions ORDER BY numero ASC");
        $stmt->execute();
    } else {
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
    foreach ($editions as &$ed) {
        $ed['edition_ref'] = (int)$ed['numero'];
        // Fallback : si les colonnes détaillées sont NULL, dériver de date_debut/date_fin
        if (empty($ed['inscription_debut']) && !empty($ed['date_debut'])) {
            $ed['inscription_debut']        = $ed['date_debut'];
            $ed['inscription_fin']          = $ed['date_fin'];
            $ed['correction_debut']         = $ed['date_fin'];
            $ed['correction_fin']           = $ed['date_fin'];
            $ed['correction_prolongement']  = $ed['date_fin'];
            $ed['deliberation']             = $ed['date_fin'];
            $ed['ceremonie_remise']         = $ed['date_fin'];
        }
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

function updateEditionDates($user) {
    $data = json_decode(file_get_contents('php://input'), true);
    $numero = (int)($data['numero'] ?? 0);
    if (!$numero) {
        echo json_encode(['success' => false, 'message' => 'numero manquant']);
        return;
    }

    $db = getDB();
    $stmt = $db->prepare("
        UPDATE cp2i_editions SET
            inscription_debut       = :inscription_debut,
            inscription_fin         = :inscription_fin,
            correction_debut        = :correction_debut,
            correction_fin          = :correction_fin,
            correction_prolongement = :correction_prolongement,
            deliberation            = :deliberation,
            ceremonie_remise        = :ceremonie_remise,
            date_debut              = :inscription_debut,
            date_fin                = :correction_prolongement
        WHERE numero = :numero
    ");
    $stmt->execute([
        ':inscription_debut'        => $data['inscription_debut']        ?? null,
        ':inscription_fin'          => $data['inscription_fin']          ?? null,
        ':correction_debut'         => $data['correction_debut']         ?? null,
        ':correction_fin'           => $data['correction_fin']           ?? null,
        ':correction_prolongement'  => $data['correction_prolongement']  ?? null,
        ':deliberation'             => $data['deliberation']             ?? null,
        ':ceremonie_remise'         => $data['ceremonie_remise']         ?? null,
        ':numero'                   => $numero,
    ]);
    echo json_encode(['success' => true, 'message' => 'Dates mises à jour']);
}
?>
