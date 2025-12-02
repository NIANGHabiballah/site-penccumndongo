<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config/database.php';

// Vérification de l'authentification
$headers = getallheaders();
if (!isset($headers['Authorization'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Token manquant']);
    exit;
}

$token = str_replace('Bearer ', '', $headers['Authorization']);
if (empty($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Token invalide']);
    exit;
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Vérifier le token
    $stmt = $pdo->prepare("SELECT id, role FROM cp2i_users WHERE remember_token = ? AND role IN ('admin', 'correcteur')");
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Token invalide']);
        exit;
    }
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur: ' . $e->getMessage()]);
    exit;
}

if (!isset($_GET['texte_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'ID du texte requis']);
    exit;
}

$texte_id = (int)$_GET['texte_id'];

try {
    // Récupérer les évaluations individuelles pour ce texte
    $stmt = $pdo->prepare("
        SELECT 
            e.id,
            e.correcteur_id,
            e.note_totale as note,
            e.remarques as commentaire,
            'termine' as statut,
            e.created_at as date_evaluation,
            u.prenom as correcteur_prenom,
            u.nom as correcteur_nom
        FROM cp2i_evaluations e
        JOIN cp2i_users u ON e.correcteur_id = u.id
        WHERE e.texte_id = ?
        ORDER BY e.created_at DESC
    ");
    
    $stmt->execute([$texte_id]);
    $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Si pas d'évaluations, récupérer les correcteurs assignés
    if (empty($evaluations)) {
        $stmt = $pdo->prepare("
            SELECT 
                a.corrector_id as correcteur_id,
                u.prenom as correcteur_prenom,
                u.nom as correcteur_nom
            FROM cp2i_affectations a
            JOIN cp2i_users u ON a.corrector_id = u.id
            WHERE a.texte_id = ?
        ");
        
        $stmt->execute([$texte_id]);
        $affectations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $evaluations = array_map(function($affectation) {
            return [
                'correcteur_id' => $affectation['correcteur_id'],
                'correcteur_prenom' => $affectation['correcteur_prenom'],
                'correcteur_nom' => $affectation['correcteur_nom'],
                'note' => null,
                'commentaire' => null,
                'statut' => 'en_attente',
                'date_evaluation' => null
            ];
        }, $affectations);
    }
    
    echo json_encode([
        'success' => true,
        'evaluations' => $evaluations
    ]);
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur SQL: ' . $e->getMessage()]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur générale: ' . $e->getMessage()]);
}
?>