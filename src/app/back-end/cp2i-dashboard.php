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
        
        // Stats d'affectation détaillées
        $stmt = $db->prepare("
            SELECT 
                (SELECT COUNT(*) FROM cp2i_affectations) as total_affectations,
                (SELECT COUNT(*) FROM cp2i_affectations a JOIN cp2i_textes t ON a.texte_id = t.id WHERE t.statut IN ('accepte', 'refuse')) as affectations_terminees,
                (SELECT COUNT(*) FROM cp2i_affectations a JOIN cp2i_textes t ON a.texte_id = t.id WHERE t.statut = 'en_attente') as affectations_restantes,
                (SELECT COUNT(DISTINCT t.id) FROM cp2i_textes t JOIN cp2i_affectations a ON t.id = a.texte_id) as textes_affectes,
                (SELECT COUNT(*) FROM cp2i_textes t LEFT JOIN cp2i_affectations a ON t.id = a.texte_id WHERE a.texte_id IS NULL) as textes_non_affectes
        ");
        $stmt->execute();
        $affectation_stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Stats par correcteur - calcul simple et séparé
        $correcteurs_stats = [];
        $stmt = $db->prepare("SELECT id, prenom, nom, email FROM cp2i_users WHERE role = 'correcteur' ORDER BY nom");
        $stmt->execute();
        $correcteurs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($correcteurs as $correcteur) {
            // Textes assignés à ce correcteur
            $stmt = $db->prepare("SELECT COUNT(*) FROM cp2i_affectations WHERE corrector_id = ?");
            $stmt->execute([$correcteur['id']]);
            $assignes = (int)$stmt->fetchColumn();
            
            // Compter les évaluations faites par ce correcteur sur SES textes assignés
            $stmt = $db->prepare("
                SELECT COUNT(*) 
                FROM cp2i_evaluations e
                INNER JOIN cp2i_affectations a ON e.texte_id = a.texte_id
                WHERE e.correcteur_id = ? AND a.corrector_id = ?
            ");
            $stmt->execute([$correcteur['id'], $correcteur['id']]);
            $corriges = (int)$stmt->fetchColumn();
            
            $correcteurs_stats[] = [
                'id' => $correcteur['id'],
                'correcteur_nom_complet' => $correcteur['prenom'] . ' ' . $correcteur['nom'],
                'correcteur_email' => $correcteur['email'],
                'textes_assignes' => $assignes,
                'textes_corriges' => $corriges,
                'textes_restants' => $assignes - $corriges
            ];
        }
        
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
            LEFT JOIN cp2i_affectations a ON t.id = a.texte_id
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
                    COUNT(DISTINCT CASE WHEN EXISTS(SELECT 1 FROM cp2i_affectations a WHERE a.texte_id = cp2i_textes.id) AND statut = 'en_attente' THEN cp2i_textes.id END) as textes_en_attente,
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
                'total_affectations' => $affectation_stats['total_affectations'] ?? 0,
                'affectations_terminees' => $affectation_stats['affectations_terminees'] ?? 0,
                'affectations_restantes' => $affectation_stats['affectations_restantes'] ?? 0,
                'correcteurs_stats' => $correcteurs_stats
            ]),
            'stats_langues' => $stats_langues,
            'users_stats' => $users_stats,
            'affectation_stats' => $affectation_stats
        ]);
    }
}

function getProfile($user) {
    $db = getDB();
    
    $stmt = $db->prepare("SELECT id, email, nom, prenom, role, created_at, telephone, whatsapp, ville, last_login FROM cp2i_users WHERE id = ?");
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
        case 'unassign_corrector':
            unassignCorrector($input);
            break;
        case 'remove_all_assignments':
            removeAllAssignments();
            break;
        case 'reset_all_assignments':
            resetAllAssignments();
            break;
        case 'direct_unassign':
            directUnassign($input);
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
    
    // Récupérer tous les utilisateurs avec leurs stats et informations complètes
    $stmt = $db->prepare("
        SELECT u.id, u.email, u.nom, u.prenom, u.role, u.created_at,
               u.telephone, u.whatsapp, u.ville, u.last_login,
               COUNT(t.id) as nb_textes,
               AVG(t.note) as note_moyenne
        FROM cp2i_users u
        LEFT JOIN cp2i_textes t ON u.id = t.user_id
        GROUP BY u.id
        ORDER BY u.role, u.created_at DESC
    ");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculer le classement pour chaque participant
    foreach ($users as &$user) {
        if ($user['role'] === 'participant' && $user['note_moyenne'] && $user['note_moyenne'] > 0) {
            // Compter combien de participants ont une note moyenne supérieure
            $stmt = $db->prepare("
                SELECT COUNT(*) as count
                FROM (
                    SELECT u2.id, AVG(t2.note) as avg_note
                    FROM cp2i_users u2
                    LEFT JOIN cp2i_textes t2 ON u2.id = t2.user_id
                    WHERE u2.role = 'participant' AND t2.note IS NOT NULL AND t2.note > 0
                    GROUP BY u2.id
                    HAVING avg_note > ?
                ) as rankings
            ");
            $stmt->execute([$user['note_moyenne']]);
            $user['classement'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'] + 1;
        } else {
            $user['classement'] = null;
        }
    }
    
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
    
    // Log des données reçues pour débogage
    error_log('assignCorrector - Données reçues: ' . json_encode($data));
    
    $texte_id = $data['texte_id'] ?? 0;
    $corrector_id = $data['corrector_id'] ?? 0;
    
    // Validation plus stricte
    if (!$texte_id || !$corrector_id || !is_numeric($texte_id) || !is_numeric($corrector_id)) {
        error_log('assignCorrector - IDs invalides: texte_id=' . $texte_id . ', corrector_id=' . $corrector_id);
        http_response_code(400);
        echo json_encode(['error' => 'IDs texte et correcteur requis et doivent être numériques']);
        return;
    }
    
    try {
        // Vérifier que le texte existe
        $stmt = $db->prepare("SELECT id FROM cp2i_textes WHERE id = ?");
        $stmt->execute([$texte_id]);
        if (!$stmt->fetch()) {
            error_log('assignCorrector - Texte inexistant: ' . $texte_id);
            http_response_code(400);
            echo json_encode(['error' => 'Texte inexistant']);
            return;
        }
        
        // Vérifier que le correcteur existe et a le bon rôle
        $stmt = $db->prepare("SELECT id, role FROM cp2i_users WHERE id = ?");
        $stmt->execute([$corrector_id]);
        $corrector = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$corrector) {
            error_log('assignCorrector - Correcteur inexistant: ' . $corrector_id);
            http_response_code(400);
            echo json_encode(['error' => 'Correcteur inexistant']);
            return;
        }
        if ($corrector['role'] !== 'correcteur') {
            error_log('assignCorrector - Utilisateur pas correcteur: ' . $corrector_id . ' (rôle: ' . $corrector['role'] . ')');
            http_response_code(400);
            echo json_encode(['error' => 'L\'utilisateur n\'est pas un correcteur']);
            return;
        }
        
        // Vérifier si ce correcteur est déjà affecté à ce texte
        $stmt = $db->prepare("SELECT id FROM cp2i_affectations WHERE texte_id = ? AND corrector_id = ?");
        $stmt->execute([$texte_id, $corrector_id]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            error_log('assignCorrector - Affectation déjà existante: texte=' . $texte_id . ', correcteur=' . $corrector_id);
            http_response_code(400);
            echo json_encode(['error' => 'Ce correcteur est déjà affecté à ce texte']);
            return;
        }
        
        // Vérifier le nombre d'affectations existantes pour ce texte
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM cp2i_affectations WHERE texte_id = ?");
        $stmt->execute([$texte_id]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        if ($count >= 3) {
            error_log('assignCorrector - Texte déjà complet: ' . $texte_id . ' (' . $count . ' correcteurs)');
            http_response_code(400);
            echo json_encode(['error' => 'Ce texte a déjà 3 correcteurs assignés']);
            return;
        }
        
        // Créer la nouvelle affectation
        $stmt = $db->prepare("INSERT INTO cp2i_affectations (texte_id, corrector_id, created_at) VALUES (?, ?, NOW())");
        $stmt->execute([$texte_id, $corrector_id]);
        
        error_log('assignCorrector - Succès: texte=' . $texte_id . ', correcteur=' . $corrector_id);
        echo json_encode(['success' => true, 'message' => 'Correcteur affecté avec succès']);
        
    } catch (Exception $e) {
        error_log('assignCorrector - Exception: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de l\'affectation: ' . $e->getMessage()]);
    }
}

function unassignCorrector($data) {
    $db = getDB();
    
    // Log des données reçues pour débogage
    error_log('unassignCorrector - Données reçues: ' . json_encode($data));
    
    $texte_id = $data['texte_id'] ?? 0;
    $corrector_id = $data['corrector_id'] ?? 0;
    
    // Validation plus stricte
    if (!$texte_id || !$corrector_id || !is_numeric($texte_id) || !is_numeric($corrector_id)) {
        error_log('unassignCorrector - IDs invalides: texte_id=' . $texte_id . ', corrector_id=' . $corrector_id);
        http_response_code(400);
        echo json_encode(['error' => 'IDs texte et correcteur requis et doivent être numériques']);
        return;
    }
    
    try {
        // Vérifier si l'affectation existe
        $stmt = $db->prepare("SELECT id FROM cp2i_affectations WHERE texte_id = ? AND corrector_id = ?");
        $stmt->execute([$texte_id, $corrector_id]);
        $existing = $stmt->fetch();
        
        if (!$existing) {
            error_log('unassignCorrector - Affectation inexistante: texte=' . $texte_id . ', correcteur=' . $corrector_id);
            http_response_code(400);
            echo json_encode(['error' => 'Cette affectation n\'existe pas']);
            return;
        }
        
        // Supprimer l'affectation
        $stmt = $db->prepare("DELETE FROM cp2i_affectations WHERE texte_id = ? AND corrector_id = ?");
        $result = $stmt->execute([$texte_id, $corrector_id]);
        
        if ($result && $stmt->rowCount() > 0) {
            error_log('unassignCorrector - Succès: texte=' . $texte_id . ', correcteur=' . $corrector_id);
            echo json_encode(['success' => true, 'message' => 'Correcteur désassigné avec succès']);
        } else {
            error_log('unassignCorrector - Échec suppression: texte=' . $texte_id . ', correcteur=' . $corrector_id);
            http_response_code(500);
            echo json_encode(['error' => 'Échec de la suppression de l\'affectation']);
        }
        
    } catch (Exception $e) {
        error_log('unassignCorrector - Exception: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de la désassignation: ' . $e->getMessage()]);
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

function removeAllAssignments() {
    $db = getDB();
    
    try {
        $stmt = $db->prepare("DELETE FROM cp2i_affectations");
        $result = $stmt->execute();
        $count = $stmt->rowCount();
        
        error_log('removeAllAssignments - Suppression de ' . $count . ' affectations');
        
        echo json_encode([
            'success' => true, 
            'message' => "$count affectations supprimées",
            'count' => $count
        ]);
        
    } catch (Exception $e) {
        error_log('removeAllAssignments - Exception: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
    }
}

function resetAllAssignments() {
    $db = getDB();
    
    try {
        $stmt = $db->prepare("DELETE FROM cp2i_affectations");
        $result = $stmt->execute();
        $count = $stmt->rowCount();
        
        echo json_encode([
            'success' => true, 
            'message' => "RESET: $count affectations supprimées",
            'count' => $count
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur reset: ' . $e->getMessage()]);
    }
}

function directUnassign($data) {
    $db = getDB();
    
    $texte_id = $data['texte_id'] ?? 0;
    $corrector_id = $data['corrector_id'] ?? 0;
    
    try {
        $stmt = $db->prepare("DELETE FROM cp2i_affectations WHERE texte_id = ? AND corrector_id = ?");
        $result = $stmt->execute([$texte_id, $corrector_id]);
        $count = $stmt->rowCount();
        
        echo json_encode([
            'success' => true, 
            'message' => "Affectation supprimée",
            'count' => $count
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Erreur: ' . $e->getMessage()]);
    }
}
?>