<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

// Configuration base de données
define('DB_HOST', 'localhost');
define('DB_NAME', 'u122559880_form_contact');
define('DB_USER', 'u122559880_root');
define('DB_PASS', 'Tafsir#27');

function getDB() {
    try {
        return new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8',
            DB_USER,
            DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Connexion DB échouée: ' . $e->getMessage()]);
        exit;
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST' && $action === 'register') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $nom = $input['nom'] ?? '';
    $prenom = $input['prenom'] ?? '';
    $telephone = $input['telephone'] ?? '';
    $ville = $input['ville'] ?? '';
    $role = $input['role'] ?? 'participant';
    
    // Validation basique
    if (!$email || !$password || !$nom || !$prenom || !$telephone || !$ville) {
        http_response_code(400);
        echo json_encode(['error' => 'Tous les champs sont requis']);
        exit;
    }
    
    try {
        $db = getDB();
        
        // Vérifier si email existe
        $stmt = $db->prepare("SELECT id FROM cp2i_users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Email déjà utilisé']);
            exit;
        }
        
        // Créer utilisateur
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $verificationToken = bin2hex(random_bytes(32));
        
        $stmt = $db->prepare("
            INSERT INTO cp2i_users (email, password, nom, prenom, role, email_verified, verification_token, created_at) 
            VALUES (?, ?, ?, ?, ?, FALSE, ?, NOW())
        ");
        
        $result = $stmt->execute([
            $email, $hashedPassword, $nom, $prenom, $role, $verificationToken
        ]);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Inscription réussie !',
                'email_sent' => true
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de l\'insertion']);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur: ' . $e->getMessage()]);
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Action non trouvée']);
}
?>