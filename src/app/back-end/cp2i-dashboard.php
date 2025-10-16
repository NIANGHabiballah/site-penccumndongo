<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user = verifyToken();
    $action = $_GET['action'] ?? 'stats';
    
    switch ($action) {
        case 'stats':
            getStats($user);
            break;
        case 'profile':
            getProfile($user);
            break;
        case 'users':
            if ($user['role'] === 'admin') {
                getUsers();
            } else {
                http_response_code(403);
                echo json_encode(['error' => 'Accès refusé']);
            }
            break;
        case 'messages':
            if ($user['role'] === 'admin') {
                getMessages($user);
            } else {
                http_response_code(403);
                echo json_encode(['error' => 'Accès refusé']);
            }
            break;
        case 'recipients':
            if ($user['role'] === 'admin') {
                getRecipients($user);
            } else {
                http_response_code(403);
                echo json_encode(['error' => 'Accès refusé']);
            }
            break;
    }
}

function getStats($user) {
    $db = getDB();
    
    if ($user['role'] === 'participant') {
        // Stats pour participant
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) as total_textes,
                SUM(CASE WHEN statut = 'accepte' THEN 1 ELSE 0 END) as textes_acceptes,
                SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END) as textes_refuses,
                SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as textes_en_attente,
                AVG(CASE WHEN note IS NOT NULL THEN note ELSE NULL END) as note_moyenne
            FROM cp2i_textes 
            WHERE user_id = ?
        ");
        $stmt->execute([$user['user_id']]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Derniers textes
        $stmt = $db->prepare("SELECT titre, statut, note, created_at FROM cp2i_textes WHERE user_id = ? ORDER BY created_at DESC LIMIT 5");
        $stmt->execute([$user['user_id']]);
        $derniers_textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'stats' => $stats,
            'derniers_textes' => $derniers_textes
        ]);
        
    } else {
        // Stats pour correcteur/admin
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) as total_textes,
                SUM(CASE WHEN statut = 'accepte' THEN 1 ELSE 0 END) as textes_acceptes,
                SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END) as textes_refuses,
                SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as textes_en_attente,
                AVG(CASE WHEN note IS NOT NULL THEN note ELSE NULL END) as note_moyenne
            FROM cp2i_textes
        ");
        $stmt->execute();
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Stats par langue
        $stmt = $db->prepare("
            SELECT langue, COUNT(*) as count 
            FROM cp2i_textes 
            GROUP BY langue
        ");
        $stmt->execute();
        $stats_langues = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Comptes utilisateurs
        $stmt = $db->prepare("
            SELECT 
                COUNT(CASE WHEN role = 'participant' THEN 1 END) as total_participants,
                COUNT(CASE WHEN role = 'correcteur' THEN 1 END) as total_correcteurs,
                COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins
            FROM cp2i_users
        ");
        $stmt->execute();
        $users_stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Stats d'affectation
        $stmt = $db->prepare("
            SELECT 
                (SELECT COUNT(*) FROM cp2i_users p JOIN cp2i_affectations a ON p.id = a.participant_id WHERE p.role = 'participant') as participants_affectes,
                (SELECT COUNT(*) FROM cp2i_users p LEFT JOIN cp2i_affectations a ON p.id = a.participant_id WHERE p.role = 'participant' AND a.participant_id IS NULL) as participants_non_affectes
        ");
        $stmt->execute();
        $affectation_stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Stats par correcteur
        $stmt = $db->prepare("
            SELECT 
                c.id, c.nom, c.prenom,
                COUNT(a.participant_id) as participants_assignes,
                COUNT(CASE WHEN t.statut IN ('accepte', 'refuse') THEN t.id END) as textes_corriges,
                COUNT(CASE WHEN t.statut = 'en_attente' THEN t.id END) as textes_restants
            FROM cp2i_users c
            LEFT JOIN cp2i_affectations a ON c.id = a.corrector_id
            LEFT JOIN cp2i_textes t ON a.participant_id = t.user_id
            WHERE c.role = 'correcteur'
            GROUP BY c.id
        ");
        $stmt->execute();
        $correcteurs_stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Log pour débogage
        error_log('Dashboard stats: ' . json_encode([
            'affectation_stats' => $affectation_stats,
            'correcteurs_count' => count($correcteurs_stats)
        ]));
        
        echo json_encode([
            'stats' => $stats,
            'stats_langues' => $stats_langues,
            'users_stats' => $users_stats,
            'affectation_stats' => $affectation_stats,
            'correcteurs_stats' => $correcteurs_stats
        ]);
    }
}

function getProfile($user) {
    $db = getDB();
    
    $stmt = $db->prepare("SELECT id, email, nom, prenom, telephone, role, created_at FROM cp2i_users WHERE id = ?");
    $stmt->execute([$user['user_id']]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode(['profile' => $profile]);
}

// Nouvelle fonction pour gérer les utilisateurs (admin seulement)
if ($method === 'POST' && isset($_GET['action'])) {
    $user = verifyToken();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        exit;
    }
    
    $action = $_GET['action'];
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'get_users':
            getUsers();
            break;
        case 'assign_corrector':
            assignCorrector($input);
            break;
        case 'send_message':
            sendMessage($user, $input);
            break;
        case 'delete_message':
            deleteMessage($user, $input);
            break;
    }
}

function getUsers() {
    $db = getDB();
    
    // Récupérer tous les utilisateurs avec leurs stats
    $stmt = $db->prepare("
        SELECT u.id, u.email, u.nom, u.prenom, u.telephone, u.role, u.created_at,
               COUNT(t.id) as nb_textes,
               AVG(t.note) as note_moyenne
        FROM cp2i_users u
        LEFT JOIN cp2i_textes t ON u.id = t.user_id
        GROUP BY u.id
        ORDER BY u.role, u.created_at DESC
    ");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Récupérer les affectations existantes
    $stmt = $db->prepare("
        SELECT a.participant_id, a.corrector_id,
               p.nom as participant_nom, p.prenom as participant_prenom,
               c.nom as corrector_nom, c.prenom as corrector_prenom
        FROM cp2i_affectations a
        JOIN cp2i_users p ON a.participant_id = p.id
        JOIN cp2i_users c ON a.corrector_id = c.id
    ");
    $stmt->execute();
    $affectations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'users' => $users,
        'affectations' => $affectations
    ]);
}

function assignCorrector($data) {
    $db = getDB();
    
    $participant_id = $data['participant_id'] ?? 0;
    $corrector_id = $data['corrector_id'] ?? 0;
    
    if (!$participant_id || !$corrector_id) {
        http_response_code(400);
        echo json_encode(['error' => 'IDs participant et correcteur requis']);
        return;
    }
    
    try {
        // Vérifier si le participant est déjà affecté
        $stmt = $db->prepare("SELECT corrector_id FROM cp2i_affectations WHERE participant_id = ?");
        $stmt->execute([$participant_id]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            // Mettre à jour l'affectation existante
            $stmt = $db->prepare("UPDATE cp2i_affectations SET corrector_id = ? WHERE participant_id = ?");
            $stmt->execute([$corrector_id, $participant_id]);
            echo json_encode(['success' => true, 'message' => 'Affectation mise à jour avec succès']);
        } else {
            // Créer une nouvelle affectation
            $stmt = $db->prepare("INSERT INTO cp2i_affectations (participant_id, corrector_id) VALUES (?, ?)");
            $stmt->execute([$participant_id, $corrector_id]);
            echo json_encode(['success' => true, 'message' => 'Affectation créée avec succès']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de l\'affectation: ' . $e->getMessage()]);
    }
}

// Fonctions de messagerie
function getMessages($user) {
    $db = getDB();
    
    $stmt = $db->prepare("
        SELECT m.*, 
               COUNT(mr.id) as total_recipients,
               COUNT(CASE WHEN mr.read_at IS NOT NULL THEN 1 END) as read_count
        FROM cp2i_messages m
        LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id
        WHERE m.sender_id = ?
        GROUP BY m.id
        ORDER BY m.created_at DESC
    ");
    $stmt->execute([$user['user_id']]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['messages' => $messages]);
}

function getRecipients($user) {
    $db = getDB();
    
    $stmt = $db->prepare("
        SELECT id, email, prenom, nom, role 
        FROM cp2i_users 
        WHERE id != ?
        ORDER BY role, prenom, nom
    ");
    $stmt->execute([$user['user_id']]);
    $recipients = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['recipients' => $recipients]);
}

function sendMessage($user, $data) {
    $db = getDB();
    
    $subject = $data['subject'] ?? '';
    $content = $data['content'] ?? '';
    $recipients = $data['recipients'] ?? [];
    $send_to_all = $data['send_to_all'] ?? false;
    
    if (!$subject || !$content) {
        http_response_code(400);
        echo json_encode(['error' => 'Sujet et contenu requis']);
        return;
    }
    
    try {
        $db->beginTransaction();
        
        $stmt = $db->prepare("
            INSERT INTO cp2i_messages (sender_id, subject, content, send_to_all) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$user['user_id'], $subject, $content, $send_to_all ? 1 : 0]);
        $message_id = $db->lastInsertId();
        
        if ($send_to_all) {
            $stmt = $db->prepare("SELECT id FROM cp2i_users WHERE id != ?");
            $stmt->execute([$user['user_id']]);
            $all_users = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $recipients = $all_users;
        }
        
        foreach ($recipients as $recipient_id) {
            $stmt = $db->prepare("
                INSERT INTO cp2i_message_recipients (message_id, recipient_id) 
                VALUES (?, ?)
            ");
            $stmt->execute([$message_id, $recipient_id]);
        }
        
        $recipient_count = count($recipients);
        $stmt = $db->prepare("
            INSERT INTO cp2i_history (user_id, action, description) 
            VALUES (?, 'message', ?)
        ");
        $description = "Message envoyé: '$subject' à $recipient_count destinataire(s)";
        $stmt->execute([$user['user_id'], $description]);
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => "Message envoyé à $recipient_count destinataire(s)"
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de l\'envoi du message']);
    }
}

function deleteMessage($user, $data) {
    $db = getDB();
    
    $message_id = $data['message_id'] ?? 0;
    
    if (!$message_id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID du message requis']);
        return;
    }
    
    try {
        $db->beginTransaction();
        
        $stmt = $db->prepare("DELETE FROM cp2i_message_recipients WHERE message_id = ?");
        $stmt->execute([$message_id]);
        
        $stmt = $db->prepare("DELETE FROM cp2i_messages WHERE id = ? AND sender_id = ?");
        $stmt->execute([$message_id, $user['user_id']]);
        
        $db->commit();
        
        echo json_encode(['success' => true, 'message' => 'Message supprimé']);
        
    } catch (Exception $e) {
        $db->rollback();
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de la suppression']);
    }
}
?>