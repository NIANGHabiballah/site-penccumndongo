<?php
header("Access-Control-Allow-Origin: https://penccumndongo.com");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Aucune donnée reçue']);
    exit;
}

// Champs obligatoires
$module              = htmlspecialchars($data['module'] ?? '');
$nom                 = htmlspecialchars($data['nom'] ?? '');
$sexe                = htmlspecialchars($data['sexe'] ?? '');
$tranche_age         = htmlspecialchars($data['trancheAge'] ?? '');
$email               = htmlspecialchars($data['email'] ?? '');
$telephone           = htmlspecialchars($data['telephone'] ?? '');
$ville               = htmlspecialchars($data['ville'] ?? '');
$statut              = htmlspecialchars($data['statut'] ?? '');
$diplome             = htmlspecialchars($data['diplome'] ?? '');
$ancien_participant  = htmlspecialchars($data['ancienParticipant'] ?? '');
$newsletter          = htmlspecialchars($data['newsletter'] ?? '');
$source              = htmlspecialchars($data['source'] ?? '');

// Champs optionnels
$whatsapp            = htmlspecialchars($data['whatsapp'] ?? '');
$autre_statut        = htmlspecialchars($data['autreStatut'] ?? '');
$autre_diplome       = htmlspecialchars($data['autreDiplome'] ?? '');
$etablissement       = htmlspecialchars($data['etablissement'] ?? '');
$domaine             = htmlspecialchars($data['domaine'] ?? '');
$autre_source        = htmlspecialchars($data['autreSource'] ?? '');
$motivation          = htmlspecialchars($data['motivation'] ?? '');

if (!$module || !$nom || !$sexe || !$tranche_age || !$email || !$telephone || !$ville || !$statut || !$diplome || !$ancien_participant || !$newsletter || !$source) {
    echo json_encode(['success' => false, 'message' => 'Merci de remplir tous les champs obligatoires.']);
    exit;
}

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=u122559880_form_contact;charset=utf8',
        'u122559880_root',
        'Tafsir#27',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Vérifier si l'email est déjà inscrit pour ce module
    $check = $pdo->prepare("SELECT id FROM inscriptions_pencboost WHERE email = ? AND module = ?");
    $check->execute([$email, $module]);
    if ($check->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Vous êtes déjà inscrit(e) à ce module avec cet email.']);
        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO inscriptions_pencboost
        (module, nom, sexe, tranche_age, email, telephone, whatsapp, ville, statut, autre_statut, diplome, autre_diplome, etablissement, domaine, ancien_participant, newsletter, source, autre_source, motivation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $module, $nom, $sexe, $tranche_age, $email, $telephone, $whatsapp,
        $ville, $statut, $autre_statut, $diplome, $autre_diplome,
        $etablissement, $domaine, $ancien_participant, $newsletter,
        $source, $autre_source, $motivation
    ]);

    echo json_encode(['success' => true, 'message' => 'Votre inscription a bien été enregistrée ! Vous recevrez les informations de connexion par email avant le début du programme.']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur serveur : ' . $e->getMessage()]);
}
