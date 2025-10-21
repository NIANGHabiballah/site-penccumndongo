<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET') {
    $user = verifyToken();
    
    if (!$user || $user['role'] !== 'correcteur') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }
    
    switch ($action) {
        case 'textes':
            getCorrecteurTexts($user['user_id']);
            break;
        case 'messages':
            getCorrecteurMessages($user['user_id']);
            break;
        case 'history':
            getCorrecteurHistory($user['user_id']);
            break;
        case 'stats':
            getCorrecteurStats($user['user_id']);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Action non spécifiée']);
    }
}

if ($method === 'POST') {
    $user = verifyToken();
    
    if (!$user || $user['role'] !== 'correcteur') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }
    
    switch ($action) {
        case 'mark_read':
            markMessageAsRead($user['user_id']);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Action non spécifiée']);
    }
}

function getCorrecteurTexts($correcteurId) {
    try {
        $db = getDB();
        
        // Solution définitive : requête simple et directe
        $stmt = $db->prepare("
            SELECT DISTINCT t.id, t.titre, t.contenu, t.langue, t.created_at, t.note, 
                   u.prenom, u.nom, 'en_attente' as statut
            FROM cp2i_textes t, cp2i_users u, cp2i_affectations a
            WHERE t.user_id = u.id 
            AND a.texte_id = t.id 
            AND a.corrector_id = ?
            ORDER BY t.created_at DESC
        ");
        $stmt->execute([$correcteurId]);
        $textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        

        
        // Mettre à jour le statut réel
        foreach ($textes as &$texte) {
            $stmt2 = $db->prepare("SELECT COUNT(*) FROM cp2i_evaluations WHERE texte_id = ? AND correcteur_id = ?");
            $stmt2->execute([$texte['id'], $correcteurId]);
            $texte['statut'] = $stmt2->fetchColumn() > 0 ? 'corrige' : 'en_attente';
        }
        
        echo json_encode(['success' => true, 'textes' => $textes]);
        
    } catch (Exception $e) {
        error_log('Erreur getCorrecteurTexts: ' . $e->getMessage());
        echo json_encode(['success' => true, 'textes' => []]);
    }
}

function getCorrecteurMessages($correcteurId) {
    try {
        $db = getDB();
        
        $stmt = $db->prepare("
            SELECT m.*, u.prenom as sender_prenom, u.nom as sender_nom, mr.read_at
            FROM cp2i_messages m
            LEFT JOIN cp2i_users u ON m.sender_id = u.id
            LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id AND mr.recipient_id = ?
            WHERE m.send_to_all = 1 OR mr.recipient_id = ?
            ORDER BY m.created_at DESC
        ");
        $stmt->execute([$correcteurId, $correcteurId]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'messages' => $messages
        ]);
    } catch (Exception $e) {
        error_log('Error in getCorrecteurMessages: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur']);
    }
}

function getCorrecteurHistory($correcteurId) {
    try {
        $db = getDB();
        
        // Historique des évaluations du correcteur
        $stmt = $db->prepare("
            SELECT t.titre, e.note_totale as note, e.remarques as commentaire, t.statut, e.updated_at, u.prenom, u.nom
            FROM cp2i_evaluations e
            JOIN cp2i_textes t ON e.texte_id = t.id
            JOIN cp2i_users u ON t.user_id = u.id
            WHERE e.correcteur_id = ?
            ORDER BY e.updated_at DESC
            LIMIT 50
        ");
        $stmt->execute([$correcteurId]);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'history' => $history
        ]);
    } catch (Exception $e) {
        error_log('Error in getCorrecteurHistory: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur']);
    }
}

function getCorrecteurStats($correcteurId) {
    try {
        $db = getDB();
        
        // Nombre total de textes assignés
        $stmt = $db->prepare("SELECT COUNT(*) FROM cp2i_affectations WHERE corrector_id = ?");
        $stmt->execute([$correcteurId]);
        $totalAssignes = (int)$stmt->fetchColumn();
        
        // Nombre de textes corrigés (avec évaluations)
        $stmt = $db->prepare("SELECT COUNT(DISTINCT texte_id) FROM cp2i_evaluations WHERE correcteur_id = ?");
        $stmt->execute([$correcteurId]);
        $corriges = (int)$stmt->fetchColumn();
        
        // Nombre à corriger
        $aCorreger = $totalAssignes - $corriges;
        
        echo json_encode([
            'success' => true,
            'stats' => [
                'total_assignes' => $totalAssignes,
                'corriges' => $corriges,
                'a_corriger' => $aCorreger
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur']);
    }
}

function markMessageAsRead($correcteurId) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $messageId = $input['message_id'] ?? 0;
        
        if (!$messageId) {
            http_response_code(400);
            echo json_encode(['error' => 'ID du message requis']);
            return;
        }
        
        $db = getDB();
        
        // Créer l'entrée si c'est un message send_to_all
        $stmt = $db->prepare("SELECT send_to_all FROM cp2i_messages WHERE id = ?");
        $stmt->execute([$messageId]);
        $message = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($message && $message['send_to_all']) {
            $stmt = $db->prepare("INSERT IGNORE INTO cp2i_message_recipients (message_id, recipient_id, read_at) VALUES (?, ?, NOW())");
            $stmt->execute([$messageId, $correcteurId]);
        } else {
            $stmt = $db->prepare("UPDATE cp2i_message_recipients SET read_at = NOW() WHERE message_id = ? AND recipient_id = ? AND read_at IS NULL");
            $stmt->execute([$messageId, $correcteurId]);
        }
        
        echo json_encode(['success' => true]);
        
    } catch (Exception $e) {
        error_log('Error in markMessageAsRead: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erreur serveur']);
    }
}
?>