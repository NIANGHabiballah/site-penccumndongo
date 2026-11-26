<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$user   = verifyToken();

if (!$user || $user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        switch ($action) {
            case 'preview':
                previewAutoAffectation();
                break;
            case 'list':
                listAffectations();
                break;
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Action GET non reconnue']);
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        switch ($action) {
            case 'run':
                runAutoAffectation($input, $user);
                break;
            case 'delete':
                deleteAffectation($input, $user);
                break;
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Action POST non reconnue']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Méthode non autorisée']);
}

// ─── PREVIEW ──────────────────────────────────────────────────────────────────
// Retourne les textes disponibles par langue + les correcteurs disponibles
function previewAutoAffectation() {
    $db = getDB();
    $edition_id = isset($_GET['edition_id']) ? (int)$_GET['edition_id'] : null;

    $where = $edition_id ? 'WHERE t.edition_id = ?' : '';
    $params = $edition_id ? [$edition_id] : [];

    // Textes par langue avec nb d'affectations actuelles
    $stmt = $db->prepare("
        SELECT
            t.langue,
            COUNT(DISTINCT t.id)                                          AS total_textes,
            COUNT(DISTINCT CASE WHEN a.texte_id IS NULL THEN t.id END)   AS textes_sans_affectation,
            COUNT(DISTINCT CASE WHEN a.texte_id IS NOT NULL THEN t.id END) AS textes_avec_affectation
        FROM cp2i_textes t
        LEFT JOIN cp2i_affectations a ON t.id = a.texte_id
        $where
        GROUP BY t.langue
        ORDER BY t.langue
    ");
    $stmt->execute($params);
    $langues = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Correcteurs disponibles
    $stmt = $db->prepare("
        SELECT u.id, u.prenom, u.nom, u.email,
               COUNT(a.id) AS nb_affectations_actuelles
        FROM cp2i_users u
        LEFT JOIN cp2i_affectations a ON u.id = a.corrector_id
        WHERE u.role = 'correcteur'
        GROUP BY u.id
        ORDER BY nb_affectations_actuelles ASC, u.nom ASC
    ");
    $stmt->execute();
    $correcteurs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success'    => true,
        'langues'    => $langues,
        'correcteurs' => $correcteurs
    ]);
}

// ─── LIST AFFECTATIONS ────────────────────────────────────────────────────────
function listAffectations() {
    $db = getDB();
    $edition_id  = isset($_GET['edition_id'])  ? (int)$_GET['edition_id']  : null;
    $correcteur_id = isset($_GET['correcteur_id']) ? (int)$_GET['correcteur_id'] : null;
    $langue      = $_GET['langue'] ?? null;

    $conditions = ['1=1'];
    $params     = [];

    if ($edition_id) {
        $conditions[] = 't.edition_id = ?';
        $params[]     = $edition_id;
    }
    if ($correcteur_id) {
        $conditions[] = 'a.corrector_id = ?';
        $params[]     = $correcteur_id;
    }
    if ($langue) {
        $conditions[] = 't.langue = ?';
        $params[]     = $langue;
    }

    $where = 'WHERE ' . implode(' AND ', $conditions);

    $stmt = $db->prepare("
        SELECT
            a.id            AS affectation_id,
            a.texte_id,
            a.corrector_id,
            a.created_at    AS date_affectation,
            t.titre         AS texte_titre,
            t.langue        AS texte_langue,
            t.statut        AS texte_statut,
            t.edition_id,
            CONCAT(auteur.prenom, ' ', auteur.nom)     AS auteur_nom,
            CONCAT(correcteur.prenom, ' ', correcteur.nom) AS correcteur_nom,
            correcteur.email AS correcteur_email,
            -- Indique si ce correcteur a déjà soumis une évaluation pour ce texte
            CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END AS a_evalue
        FROM cp2i_affectations a
        JOIN cp2i_textes t       ON a.texte_id    = t.id
        JOIN cp2i_users  auteur  ON t.user_id     = auteur.id
        JOIN cp2i_users  correcteur ON a.corrector_id = correcteur.id
        LEFT JOIN cp2i_evaluations e
               ON e.texte_id = a.texte_id AND e.correcteur_id = a.corrector_id
        $where
        ORDER BY a.created_at DESC
    ");
    $stmt->execute($params);
    $affectations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'affectations' => $affectations]);
}

// ─── RUN AUTO-AFFECTATION ─────────────────────────────────────────────────────
function runAutoAffectation($input, $admin) {
    $db = getDB();

    $correcteur_id = isset($input['correcteur_id']) ? (int)$input['correcteur_id'] : 0;
    $langues       = $input['langues']       ?? [];   // ex: ['francais','wolof']
    $nb_textes     = isset($input['nb_textes']) ? (int)$input['nb_textes'] : 0;
    $edition_id    = isset($input['edition_id']) ? (int)$input['edition_id'] : null;
    $strategie     = $input['strategie'] ?? 'equilibre'; // 'equilibre' | 'aleatoire'

    // ── Validations ──────────────────────────────────────────────────────────
    if (!$correcteur_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Correcteur requis']);
        return;
    }
    if (empty($langues)) {
        http_response_code(400);
        echo json_encode(['error' => 'Au moins une langue doit être sélectionnée']);
        return;
    }
    if ($nb_textes < 1 || $nb_textes > 200) {
        http_response_code(400);
        echo json_encode(['error' => 'Nombre de textes invalide (1-200)']);
        return;
    }

    // Vérifier que le correcteur existe
    $stmt = $db->prepare("SELECT id, prenom, nom FROM cp2i_users WHERE id = ? AND role = 'correcteur'");
    $stmt->execute([$correcteur_id]);
    $correcteur = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$correcteur) {
        http_response_code(400);
        echo json_encode(['error' => 'Correcteur introuvable']);
        return;
    }

    // ── Récupérer les textes éligibles ────────────────────────────────────────
    // Éligible = langue dans la liste, pas encore affecté à CE correcteur,
    //            moins de 3 correcteurs déjà affectés, édition filtrée si fournie
    $placeholders = implode(',', array_fill(0, count($langues), '?'));
    $editionCond  = $edition_id ? 'AND t.edition_id = ?' : '';

    $params = array_merge([$correcteur_id, 3], $langues);
    if ($edition_id) $params[] = $edition_id;

    $stmt = $db->prepare("
        SELECT t.id, t.titre, t.langue, t.edition_id,
               COUNT(a2.id) AS nb_correcteurs_actuels
        FROM cp2i_textes t
        LEFT JOIN cp2i_affectations a2 ON t.id = a2.texte_id
        WHERE t.langue IN ($placeholders)
          $editionCond
          AND t.id NOT IN (
              SELECT texte_id FROM cp2i_affectations WHERE corrector_id = ?
          )
        GROUP BY t.id
        HAVING nb_correcteurs_actuels < 3
        ORDER BY nb_correcteurs_actuels ASC, t.created_at ASC
    ");

    // Reconstruire les params dans le bon ordre pour la requête
    $queryParams = array_merge($langues);
    if ($edition_id) $queryParams[] = $edition_id;
    $queryParams[] = $correcteur_id;

    $stmt->execute($queryParams);
    $textesEligibles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($textesEligibles)) {
        echo json_encode([
            'success' => false,
            'message' => 'Aucun texte disponible pour ce correcteur avec les critères sélectionnés',
            'assigned' => 0
        ]);
        return;
    }

    // Stratégie aléatoire : mélanger
    if ($strategie === 'aleatoire') {
        shuffle($textesEligibles);
    }

    // Limiter au nombre demandé
    $textesAAffecter = array_slice($textesEligibles, 0, $nb_textes);

    // ── Insérer les affectations ──────────────────────────────────────────────
    $assigned = 0;
    $errors   = [];
    $details  = [];

    $stmtInsert = $db->prepare(
        "INSERT INTO cp2i_affectations (texte_id, corrector_id, created_at) VALUES (?, ?, NOW())"
    );

    foreach ($textesAAffecter as $texte) {
        try {
            $stmtInsert->execute([$texte['id'], $correcteur_id]);
            $assigned++;
            $details[] = [
                'texte_id' => $texte['id'],
                'titre'    => $texte['titre'],
                'langue'   => $texte['langue']
            ];
        } catch (Exception $e) {
            $errors[] = "Texte #{$texte['id']} : " . $e->getMessage();
        }
    }

    // Log dans l'historique
    if ($assigned > 0) {
        $languesStr = implode(', ', $langues);
        $stmt = $db->prepare(
            "INSERT INTO cp2i_history (user_id, action, description) VALUES (?, 'auto_affectation', ?)"
        );
        $stmt->execute([
            $admin['user_id'],
            "Auto-affectation : {$assigned} texte(s) [{$languesStr}] → {$correcteur['prenom']} {$correcteur['nom']}"
        ]);
    }

    echo json_encode([
        'success'   => $assigned > 0,
        'assigned'  => $assigned,
        'requested' => $nb_textes,
        'available' => count($textesEligibles),
        'details'   => $details,
        'errors'    => $errors,
        'message'   => $assigned > 0
            ? "{$assigned} texte(s) affecté(s) à {$correcteur['prenom']} {$correcteur['nom']}"
            : 'Aucune affectation réalisée'
    ]);
}

// ─── DELETE AFFECTATION ───────────────────────────────────────────────────────
function deleteAffectation($input, $admin) {
    $db = getDB();

    $affectation_id = isset($input['affectation_id']) ? (int)$input['affectation_id'] : 0;

    if (!$affectation_id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID d\'affectation requis']);
        return;
    }

    // Récupérer l'affectation avec ses détails
    $stmt = $db->prepare("
        SELECT a.id, a.texte_id, a.corrector_id,
               t.titre, t.statut,
               CONCAT(c.prenom, ' ', c.nom) AS correcteur_nom,
               CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END AS a_evalue
        FROM cp2i_affectations a
        JOIN cp2i_textes t ON a.texte_id = t.id
        JOIN cp2i_users  c ON a.corrector_id = c.id
        LEFT JOIN cp2i_evaluations e
               ON e.texte_id = a.texte_id AND e.correcteur_id = a.corrector_id
        WHERE a.id = ?
    ");
    $stmt->execute([$affectation_id]);
    $affectation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$affectation) {
        http_response_code(404);
        echo json_encode(['error' => 'Affectation introuvable']);
        return;
    }

    // Bloquer si une évaluation existe déjà pour cette paire texte/correcteur
    if ((int)$affectation['a_evalue'] === 1) {
        http_response_code(409);
        echo json_encode([
            'error'   => 'Impossible de supprimer : ce correcteur a déjà soumis une évaluation pour ce texte.',
            'details' => [
                'texte'      => $affectation['titre'],
                'correcteur' => $affectation['correcteur_nom']
            ]
        ]);
        return;
    }

    // Supprimer
    $stmt = $db->prepare("DELETE FROM cp2i_affectations WHERE id = ?");
    $stmt->execute([$affectation_id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(500);
        echo json_encode(['error' => 'Échec de la suppression']);
        return;
    }

    // Log
    $stmt = $db->prepare(
        "INSERT INTO cp2i_history (user_id, action, description) VALUES (?, 'delete_affectation', ?)"
    );
    $stmt->execute([
        $admin['user_id'],
        "Suppression affectation #{$affectation_id} : \"{$affectation['titre']}\" → {$affectation['correcteur_nom']}"
    ]);

    echo json_encode([
        'success' => true,
        'message' => "Affectation supprimée avec succès",
        'details' => [
            'texte'      => $affectation['titre'],
            'correcteur' => $affectation['correcteur_nom']
        ]
    ]);
}
?>
