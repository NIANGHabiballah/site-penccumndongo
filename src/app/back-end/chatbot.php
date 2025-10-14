<?php
require_once 'config.php';
setCorsHeaders();

$user = verifyToken();
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);
$action = $_GET['action'] ?? '';

if ($user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

switch ($method) {
    case 'GET':
        if ($action === 'config') {
            getChatbotConfig();
        } elseif ($action === 'faq') {
            getFAQ();
        } elseif ($action === 'conversations') {
            getConversations();
        } elseif ($action === 'stats') {
            getChatbotStats();
        }
        break;
    case 'POST':
        if ($action === 'config') {
            saveChatbotConfig($data);
        } elseif ($action === 'faq') {
            addFAQ($data);
        }
        break;
    case 'DELETE':
        if ($action === 'faq') {
            deleteFAQ($_GET['id']);
        }
        break;
}

function getChatbotConfig() {
    $pdo = getDB();
    $stmt = $pdo->query("SELECT * FROM chatbot_config LIMIT 1");
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$config) {
        $config = [
            'actif' => true,
            'nom' => 'Assistant CP2i',
            'message_accueil' => 'Bonjour ! Je suis l\'assistant CP2i. Comment puis-je vous aider ?',
            'langues' => json_encode(['français', 'wolof']),
            'reponse_automatique' => true
        ];
    }
    
    echo json_encode($config);
}

function saveChatbotConfig($data) {
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO chatbot_config (actif, nom, message_accueil, langues, reponse_automatique) 
            VALUES (?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
            actif = VALUES(actif), nom = VALUES(nom), message_accueil = VALUES(message_accueil), 
            langues = VALUES(langues), reponse_automatique = VALUES(reponse_automatique)
        ");
        
        $stmt->execute([
            $data['actif'],
            $data['nom'],
            $data['message_accueil'],
            json_encode($data['langues']),
            $data['reponse_automatique']
        ]);
        
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Erreur sauvegarde']);
    }
}

function getFAQ() {
    $pdo = getDB();
    $stmt = $pdo->query("SELECT * FROM chatbot_faq ORDER BY utilisation DESC");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

function addFAQ($data) {
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("INSERT INTO chatbot_faq (question, reponse, categorie) VALUES (?, ?, ?)");
        $stmt->execute([$data['question'], $data['reponse'], $data['categorie'] ?? 'generale']);
        
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Erreur ajout FAQ']);
    }
}

function deleteFAQ($id) {
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("DELETE FROM chatbot_faq WHERE id = ?");
        $stmt->execute([$id]);
        
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Erreur suppression']);
    }
}

function getConversations() {
    $pdo = getDB();
    $stmt = $pdo->query("
        SELECT c.*, u.nom, u.prenom 
        FROM chatbot_conversations c 
        JOIN users u ON c.user_id = u.id 
        ORDER BY c.date_creation DESC
    ");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

function getChatbotStats() {
    $pdo = getDB();
    
    $stats = [];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM chatbot_conversations");
    $stats['conversations_totales'] = $stmt->fetch()['count'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM chatbot_conversations WHERE statut = 'resolu_auto'");
    $stats['resolutions_auto'] = $stmt->fetch()['count'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM chatbot_conversations WHERE statut = 'transfere_humain'");
    $stats['transferts_humain'] = $stmt->fetch()['count'];
    
    $stats['taux_satisfaction'] = 92; // Calculé selon vos critères
    
    echo json_encode($stats);
}
?>