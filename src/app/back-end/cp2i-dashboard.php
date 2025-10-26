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
        case 'get_users':
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
                COUNT(CASE WHEN statut = 'accepte' THEN 1 END) as textes_acceptes,
                COUNT(CASE WHEN statut = 'refuse' THEN 1 END) as textes_refuses,
                COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as textes_en_attente,
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
                (SELECT COUNT(DISTINCT t.id) FROM cp2i_textes t JOIN cp2i_affectations a ON t.id = a.texte_id) as textes_affectes,
                (SELECT COUNT(*) FROM cp2i_textes t LEFT JOIN cp2i_affectations a ON t.id = a.texte_id WHERE a.texte_id IS NULL) as textes_non_affectes
        ");
        $stmt->execute();
        $affectation_stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Stats par correcteur avec noms des textes assignés
        $stmt = $db->prepare("
            SELECT 
                c.id, 
                CONCAT(c.prenom, ' ', c.nom) as correcteur_nom_complet,
                c.email as correcteur_email,
                COUNT(a.texte_id) as textes_assignes,
                GROUP_CONCAT(t.titre SEPARATOR ', ') as textes_noms,
                0 as textes_corriges,
                COUNT(a.texte_id) as textes_restants
            FROM cp2i_users c
            LEFT JOIN cp2i_affectations a ON c.id = a.corrector_id
            LEFT JOIN cp2i_textes t ON a.texte_id = t.id
            WHERE c.role = 'correcteur'
            GROUP BY c.id
        ");
        $stmt->execute();
        $correcteurs_stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Statistiques détaillées des affectations par texte avec noms complets
        $stmt = $db->prepare("
            SELECT 
                t.id as texte_id,
                t.titre,
                t.statut,
                CONCAT(u.prenom, ' ', u.nom) as auteur_nom_complet,
                u.email as auteur_email,
                COALESCE(COUNT(CASE WHEN a.corrector_id IS NOT NULL THEN 1 END), 0) as nb_correcteurs,
                GROUP_CONCAT(DISTINCT CONCAT(c.prenom, ' ', c.nom) SEPARATOR ', ') as correcteurs_noms,
                t.created_at as date_soumission
            FROM cp2i_textes t
            JOIN cp2i_users u ON t.user_id = u.id
            LEFT JOIN cp2i_affectations a ON u.id = a.participant_id
            LEFT JOIN cp2i_users c ON a.corrector_id = c.id AND c.role = 'correcteur'
            GROUP BY t.id, t.titre, t.statut, u.prenom, u.nom, u.email, t.created_at
            ORDER BY nb_correcteurs DESC, t.titre
        ");
        $stmt->execute();
        $textes_affectations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Log pour débogage
        error_log('Dashboard stats complet: ' . json_encode([
            'stats' => $stats,
            'users_stats' => $users_stats,
            'textes_affectations_count' => count($textes_affectations),
            'textes_affectations_sample' => array_slice($textes_affectations, 0, 2),
            'affectation_stats' => $affectation_stats
        ]));
        
        // Calculer les vraies statistiques générales
        try {
            $stmt = $db->prepare("
                SELECT 
                    COUNT(*) as total_textes,
                    SUM(CASE WHEN statut = 'accepte' THEN 1 ELSE 0 END) as textes_acceptes,
                    SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END) as textes_refuses,
                    SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as textes_en_attente,
                    AVG(CASE WHEN note IS NOT NULL AND note > 0 THEN note ELSE NULL END) as note_moyenne
                FROM cp2i_textes
            ");
            $stmt->execute();
            $real_stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Utiliser les vraies données
            $stats = $real_stats;
        } catch (Exception $e) {
            error_log('Erreur stats SQL: ' . $e->getMessage());
            // Fallback en cas d'erreur
            $stats['total_textes'] = 0;
            $stats['textes_acceptes'] = 0;
            $stats['textes_refuses'] = 0;
            $stats['textes_en_attente'] = 0;
            $stats['note_moyenne'] = null;
        }
        
        echo json_encode([
            'stats' => array_merge($stats, [
                'textes_affectations' => $textes_affectations,
                'affectation_stats' => $affectation_stats,
                'correcteurs_stats' => $correcteurs_stats
            ]),
            'stats_langues' => $stats_langues,
            'users_stats' => $users_stats
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
    
    // Récupérer les affectations existantes avec noms complets
    $stmt = $db->prepare("
        SELECT a.id as affectation_id,
               a.texte_id, 
               a.corrector_id,
               t.titre as texte_titre,
               CONCAT(c.prenom, ' ', c.nom) as correcteur_nom_complet,
               CONCAT(u.prenom, ' ', u.nom) as auteur_nom_complet,
               c.email as correcteur_email,
               a.created_at as date_affectation
        FROM cp2i_affectations a
        JOIN cp2i_textes t ON a.texte_id = t.id
        JOIN cp2i_users u ON t.user_id = u.id
        JOIN cp2i_users c ON a.corrector_id = c.id
        ORDER BY a.created_at DESC
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
    
    $texte_id = $data['texte_id'] ?? 0;
    $corrector_id = $data['corrector_id'] ?? 0;
    
    if (!$texte_id || !$corrector_id) {
        http_response_code(400);
        echo json_encode(['error' => 'IDs texte et correcteur requis']);
        return;
    }
    
    try {
        // Vérifier si ce correcteur est déjà affecté à ce texte
        $stmt = $db->prepare("SELECT id FROM cp2i_affectations WHERE texte_id = ? AND corrector_id = ?");
        $stmt->execute([$texte_id, $corrector_id]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            http_response_code(400);
            echo json_encode(['error' => 'Ce correcteur est déjà affecté à ce texte']);
            return;
        }
        
        // Vérifier le nombre d'affectations existantes pour ce texte
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM cp2i_affectations WHERE texte_id = ?");
        $stmt->execute([$texte_id]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        if ($count >= 3) {
            http_response_code(400);
            echo json_encode(['error' => 'Ce texte a déjà 3 correcteurs assignés']);
            return;
        }
        
        // Créer la nouvelle affectation
        $stmt = $db->prepare("INSERT INTO cp2i_affectations (texte_id, corrector_id) VALUES (?, ?)");
        $stmt->execute([$texte_id, $corrector_id]);
        
        echo json_encode(['success' => true, 'message' => 'Correcteur affecté avec succès']);
        
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
               SUM(CASE WHEN mr.read_at IS NOT NULL THEN 1 ELSE 0 END) as read_count
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
            $recipients = $stmt->fetchAll(PDO::FETCH_COLUMN);
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