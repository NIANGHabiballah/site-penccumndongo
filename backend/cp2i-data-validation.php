<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config/database.php';

// Fonction pour valider et corriger les données utilisateur
function validateUserData($userId) {
    global $pdo;
    
    try {
        // Compter les vrais textes de l'utilisateur
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as real_count,
                   COUNT(CASE WHEN statut = 'accepte' THEN 1 END) as acceptes,
                   COUNT(CASE WHEN statut = 'refuse' THEN 1 END) as refuses,
                   COUNT(CASE WHEN statut IN ('en_attente', 'brouillon') THEN 1 END) as en_attente,
                   AVG(CASE WHEN note IS NOT NULL THEN note END) as note_moyenne
            FROM textes 
            WHERE participant_id = ? AND deleted_at IS NULL
        ");
        $stmt->execute([$userId]);
        $realStats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Récupérer les textes détaillés
        $stmt = $pdo->prepare("
            SELECT t.*, 
                   c.id as correcteur_id,
                   c.nom as correcteur_nom,
                   CASE 
                       WHEN t.statut = 'brouillon' THEN 1
                       WHEN t.statut = 'en_attente' AND c.id IS NULL THEN 1
                       ELSE 0
                   END as peut_modifier
            FROM textes t
            LEFT JOIN corrections cor ON t.id = cor.texte_id
            LEFT JOIN users c ON cor.correcteur_id = c.id
            WHERE t.participant_id = ? AND t.deleted_at IS NULL
            ORDER BY t.created_at DESC
        ");
        $stmt->execute([$userId]);
        $textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Vérifier les messages non lus
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as unread_count
            FROM messages 
            WHERE (destinataire_id = ? OR destinataire_id IS NULL) 
            AND read_at IS NULL 
            AND deleted_at IS NULL
        ");
        $stmt->execute([$userId]);
        $messagesCount = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'stats' => [
                'total_textes' => (int)$realStats['real_count'],
                'textes_acceptes' => (int)$realStats['acceptes'],
                'textes_refuses' => (int)$realStats['refuses'],
                'textes_en_attente' => (int)$realStats['en_attente'],
                'note_moyenne' => $realStats['note_moyenne'] ? round($realStats['note_moyenne'], 1) : null
            ],
            'textes' => $textes,
            'messages_non_lus' => (int)$messagesCount['unread_count'],
            'validation_timestamp' => date('Y-m-d H:i:s')
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => 'Erreur lors de la validation des données: ' . $e->getMessage()
        ];
    }
}

// Fonction pour nettoyer les données incohérentes
function cleanInconsistentData() {
    global $pdo;
    
    try {
        $pdo->beginTransaction();
        
        // Supprimer les doublons de textes
        $pdo->exec("
            DELETE t1 FROM textes t1
            INNER JOIN textes t2 
            WHERE t1.id > t2.id 
            AND t1.participant_id = t2.participant_id 
            AND t1.titre = t2.titre 
            AND t1.created_at = t2.created_at
        ");
        
        // Corriger les statuts incohérents
        $pdo->exec("
            UPDATE textes t
            LEFT JOIN corrections c ON t.id = c.texte_id
            SET t.statut = CASE 
                WHEN c.note >= 10 THEN 'accepte'
                WHEN c.note < 10 THEN 'refuse'
                WHEN c.id IS NOT NULL AND t.statut = 'brouillon' THEN 'en_attente'
                ELSE t.statut
            END
            WHERE c.id IS NOT NULL
        ");
        
        // Marquer les messages anciens comme lus s'ils n'ont pas été lus depuis 30 jours
        $pdo->exec("
            UPDATE messages 
            SET read_at = NOW() 
            WHERE read_at IS NULL 
            AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
        ");
        
        $pdo->commit();
        
        return ['success' => true, 'message' => 'Données nettoyées avec succès'];
        
    } catch (Exception $e) {
        $pdo->rollBack();
        return ['success' => false, 'error' => 'Erreur lors du nettoyage: ' . $e->getMessage()];
    }
}

// Vérifier l'authentification
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'Token manquant']);
    exit;
}

$token = $matches[1];

try {
    // Décoder le token JWT (version simplifiée)
    $tokenParts = explode('.', $token);
    if (count($tokenParts) !== 3) {
        throw new Exception('Token invalide');
    }
    
    $payload = json_decode(base64_decode($tokenParts[1]), true);
    if (!$payload || !isset($payload['userId'])) {
        throw new Exception('Payload invalide');
    }
    
    $userId = $payload['userId'];
    
} catch (Exception $e) {
    http_response_code(403);
    echo json_encode(['error' => 'Token invalide']);
    exit;
}

// Traiter la requête
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'validate') {
            echo json_encode(validateUserData($userId));
        } elseif ($action === 'clean' && isset($_GET['admin']) && $_GET['admin'] === 'true') {
            // Vérifier si l'utilisateur est admin
            $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            if ($user && $user['role'] === 'admin') {
                echo json_encode(cleanInconsistentData());
            } else {
                http_response_code(403);
                echo json_encode(['error' => 'Accès refusé']);
            }
        } else {
            echo json_encode(validateUserData($userId));
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Méthode non autorisée']);
        break;
}
?>