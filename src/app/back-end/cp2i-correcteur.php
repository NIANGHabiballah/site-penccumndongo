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
        
        // Récupérer les textes assignés à CE correcteur via cp2i_affectations
        $stmt = $db->prepare("
            SELECT DISTINCT t.id, t.titre, t.contenu, t.langue, t.theme, t.created_at, 
                   u.prenom, u.nom
            FROM cp2i_textes t
            JOIN cp2i_users u ON t.user_id = u.id 
            WHERE EXISTS (
                SELECT 1 FROM cp2i_affectations a 
                WHERE a.texte_id = t.id AND a.corrector_id = ?
            )
            ORDER BY t.created_at DESC
        ");
        $stmt->execute([$correcteurId]);
        $textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Pour chaque texte, vérifier SEULEMENT l'évaluation de CE correcteur
        foreach ($textes as &$texte) {
            // Vérifier si CE correcteur a évalué ce texte
            $stmt2 = $db->prepare("
                SELECT note_totale, remarques 
                FROM cp2i_evaluations 
                WHERE texte_id = ? AND correcteur_id = ?
            ");
            $stmt2->execute([$texte['id'], $correcteurId]);
            $evaluation = $stmt2->fetch(PDO::FETCH_ASSOC);
            
            if ($evaluation) {
                // Ce correcteur a évalué ce texte - récupérer tous les détails
                $stmt3 = $db->prepare("
                    SELECT pertinence, coherence, correction, presentation, note_totale, remarques 
                    FROM cp2i_evaluations 
                    WHERE texte_id = ? AND correcteur_id = ?
                ");
                $stmt3->execute([$texte['id'], $correcteurId]);
                $details = $stmt3->fetch(PDO::FETCH_ASSOC);
                
                $texte['statut'] = 'corrige';
                $texte['note'] = $details['note_totale'];
                $texte['commentaire'] = $details['remarques'];
                $texte['pertinence'] = $details['pertinence'];
                $texte['coherence'] = $details['coherence'];
                $texte['correction'] = $details['correction'];
                $texte['presentation'] = $details['presentation'];
                $texte['corrected_by_me'] = true;
            } else {
                // Ce correcteur n'a pas encore évalué ce texte
                $texte['statut'] = 'en_attente';
                $texte['note'] = null;
                $texte['commentaire'] = '';
                $texte['pertinence'] = null;
                $texte['coherence'] = null;
                $texte['correction'] = null;
                $texte['presentation'] = null;
                $texte['corrected_by_me'] = false;
            }
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
            SELECT t.titre, e.note_totale as note, e.remarques as commentaire, t.statut, e.created_at as updated_at, u.prenom, u.nom
            FROM cp2i_evaluations e
            JOIN cp2i_textes t ON e.texte_id = t.id
            JOIN cp2i_users u ON t.user_id = u.id
            WHERE e.correcteur_id = ?
            ORDER BY e.created_at DESC
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
        
        // Nombre total de textes assignés à CE correcteur
        $stmt = $db->prepare("SELECT COUNT(*) FROM cp2i_affectations WHERE corrector_id = ?");
        $stmt->execute([$correcteurId]);
        $totalAssignes = (int)$stmt->fetchColumn();
        
        // Nombre de textes corrigés PAR CE correcteur uniquement
        $stmt = $db->prepare("SELECT COUNT(*) FROM cp2i_evaluations WHERE correcteur_id = ?");
        $stmt->execute([$correcteurId]);
        $corriges = (int)$stmt->fetchColumn();
        
        // Nombre à corriger pour CE correcteur
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
        
        // Vérifier si l'entrée existe déjà
        $stmt = $db->prepare("SELECT id FROM cp2i_message_recipients WHERE message_id = ? AND recipient_id = ?");
        $stmt->execute([$messageId, $correcteurId]);
        $exists = $stmt->fetch();
        
        if ($exists) {
            // Mettre à jour l'entrée existante
            $stmt = $db->prepare("UPDATE cp2i_message_recipients SET read_at = NOW() WHERE message_id = ? AND recipient_id = ?");
            $stmt->execute([$messageId, $correcteurId]);
        } else {
            // Créer une nouvelle entrée
            $stmt = $db->prepare("INSERT INTO cp2i_message_recipients (message_id, recipient_id, read_at) VALUES (?, ?, NOW())");
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