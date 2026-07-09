<?php
// CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = ['http://localhost:4200', 'https://penccumndongo.com', 'http://penccumndongo.com'];
if (in_array($origin, $allowed)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *");
}
header('Content-Type: application/json');
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// Connexion directe (pas de require config.php)
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=u122559880_form_contact;charset=utf8',
        'u122559880_root',
        'Tafsir#27',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Connexion DB échouée']);
    exit;
}

// Créer la table si elle n'existe pas encore
$pdo->exec("
    CREATE TABLE IF NOT EXISTS presences_pencboost (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module VARCHAR(50) NOT NULL,
        edition VARCHAR(10) NOT NULL DEFAULT '2026',
        nom_prenom VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL,
        telephone VARCHAR(30) NOT NULL,
        heure_arrivee VARCHAR(10) NOT NULL,
        statut_presence ENUM('present','retard') NOT NULL DEFAULT 'present',
        note TINYINT DEFAULT NULL,
        observations TEXT DEFAULT NULL,
        suggestions TEXT DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_presence (email, module, edition)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");

// Ajouter colonnes si table existante sans ces champs
try { $pdo->exec("ALTER TABLE presences_pencboost ADD COLUMN note TINYINT DEFAULT NULL"); } catch(Exception $e) {}
try { $pdo->exec("ALTER TABLE presences_pencboost ADD COLUMN suggestions TEXT DEFAULT NULL"); } catch(Exception $e) {}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ─── POST : enregistrer une présence ───────────────────────────────────────
if ($method === 'POST' && $action === 'enregistrer') {
    $data = json_decode(file_get_contents('php://input'), true);

    $module       = trim($data['module'] ?? '');
    $nom_prenom   = htmlspecialchars(trim($data['nom_prenom'] ?? ''));
    $email        = strtolower(trim($data['email'] ?? ''));
    $telephone    = htmlspecialchars(trim($data['telephone'] ?? ''));
    $heure        = htmlspecialchars(trim($data['heure_arrivee'] ?? ''));
    $statut       = in_array($data['statut_presence'] ?? '', ['present','retard']) ? $data['statut_presence'] : 'present';
    $note         = isset($data['note']) && $data['note'] >= 1 && $data['note'] <= 5 ? (int)$data['note'] : null;
    $observations = htmlspecialchars(trim($data['observations'] ?? ''));
    $suggestions  = htmlspecialchars(trim($data['suggestions'] ?? ''));
    $edition      = '2026';
    $ip           = $_SERVER['REMOTE_ADDR'] ?? null;

    $modules_valides = ['leadership','design','numerique-ia','marketing','employabilite','bureautique','poesie'];

    if (!$module || !in_array($module, $modules_valides)) {
        echo json_encode(['success' => false, 'message' => 'Module invalide.']);
        exit;
    }
    if (!$nom_prenom || !$email || !$telephone || !$heure) {
        echo json_encode(['success' => false, 'message' => 'Tous les champs obligatoires doivent être remplis.']);
        exit;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Adresse email invalide.']);
        exit;
    }

    // Vérifier si l'email est inscrit à ce module
    $check = $pdo->prepare("SELECT id FROM inscriptions_pencboost WHERE LOWER(email) = LOWER(?) AND module = ?");
    $check->execute([$email, $module]);
    if (!$check->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Votre email ne figure pas dans la liste des inscrits à ce module. Vérifiez votre inscription.']);
        exit;
    }

    // Vérifier doublon présence
    $dup = $pdo->prepare("SELECT id FROM presences_pencboost WHERE LOWER(email) = LOWER(?) AND module = ? AND edition = ?");
    $dup->execute([$email, $module, $edition]);
    if ($dup->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Votre présence à ce module a déjà été enregistrée.']);
        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO presences_pencboost (module, edition, nom_prenom, email, telephone, heure_arrivee, statut_presence, note, observations, suggestions, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$module, $edition, $nom_prenom, $email, $telephone, $heure, $statut, $note, $observations, $suggestions, $ip]);

    echo json_encode(['success' => true, 'message' => 'Votre présence a bien été enregistrée. Bonne session !']);
    exit;
}

// ─── GET : données pour le dashboard admin ────────────────────────────────
if ($method === 'GET') {
    // Vérification clé admin formations
    $admin_key = $_GET['admin_key'] ?? '';
    if ($admin_key !== 'PencBoostAdmin2026') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }

    if ($action === 'stats') {
        // Stats globales présences par module
        $stmt = $pdo->query("
            SELECT module,
                   COUNT(*) as total,
                   SUM(statut_presence = 'present') as presents,
                   SUM(statut_presence = 'retard') as retards
            FROM presences_pencboost
            WHERE edition = '2026'
            GROUP BY module
        ");
        $presences_par_module = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Stats inscriptions par module
        $stmt2 = $pdo->query("
            SELECT module, COUNT(*) as inscrits
            FROM inscriptions_pencboost
            GROUP BY module
        ");
        $inscrits_par_module = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        // Total inscrits
        $total_inscrits = $pdo->query("SELECT COUNT(*) FROM inscriptions_pencboost")->fetchColumn();
        $total_presences = $pdo->query("SELECT COUNT(*) FROM presences_pencboost WHERE edition='2026'")->fetchColumn();

        echo json_encode([
            'success' => true,
            'total_inscrits' => (int)$total_inscrits,
            'total_presences' => (int)$total_presences,
            'presences_par_module' => $presences_par_module,
            'inscrits_par_module' => $inscrits_par_module
        ]);
        exit;
    }

    if ($action === 'liste') {
        $module = $_GET['module'] ?? '';
        $search = '%' . trim($_GET['search'] ?? '') . '%';

        $where = "WHERE edition = '2026'";
        $params = [];
        if ($module) { $where .= " AND module = ?"; $params[] = $module; }
        if (trim($_GET['search'] ?? '')) { $where .= " AND (nom_prenom LIKE ? OR email LIKE ?)"; $params[] = $search; $params[] = $search; }

        try {
            $stmt = $pdo->prepare("SELECT id, module, edition, nom_prenom, email, telephone, heure_arrivee, statut_presence, observations, created_at FROM presences_pencboost $where ORDER BY created_at DESC");
            $stmt->execute($params);
            echo json_encode(['success' => true, 'presences' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'inscrits') {
        $module = $_GET['module'] ?? '';
        $search = '%' . trim($_GET['search'] ?? '') . '%';

        $where = "WHERE 1=1";
        $params = [];
        if ($module) { $where .= " AND module = ?"; $params[] = $module; }
        if (trim($_GET['search'] ?? '')) { $where .= " AND (nom LIKE ? OR email LIKE ?)"; $params[] = $search; $params[] = $search; }

        try {
            $stmt = $pdo->prepare("SELECT * FROM inscriptions_pencboost $where ORDER BY id DESC");
            $stmt->execute($params);
            echo json_encode(['success' => true, 'inscrits' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }

    if ($action === 'export_presences') {
        $module = $_GET['module'] ?? '';
        $where = "WHERE edition = '2026'";
        $params = [];
        if ($module) { $where .= " AND module = ?"; $params[] = $module; }

        $stmt = $pdo->prepare("SELECT nom_prenom, email, telephone, module, heure_arrivee, statut_presence, observations, created_at FROM presences_pencboost $where ORDER BY module, created_at");
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $rows]);
        exit;
    }

    if ($action === 'export_inscrits') {
        $module = $_GET['module'] ?? '';
        $where = $module ? "WHERE module = ?" : "";
        $params = $module ? [$module] : [];

        $stmt = $pdo->prepare("SELECT * FROM inscriptions_pencboost $where ORDER BY module, id");
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $rows]);
        exit;
    }
}

echo json_encode(['success' => false, 'message' => 'Action non reconnue.']);
