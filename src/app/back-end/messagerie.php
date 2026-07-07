<?php
require_once 'config.php';
setCorsHeaders();

$user = verifyToken();
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'conversations') {
            getConversations($user);
        } elseif ($action === 'templates') {
            getTemplates();
        }
        break;
    case 'POST':
        if ($action === 'send') {
            envoyerMessage($user, $data);
        } elseif ($action === 'broadcast') {
            envoyerMessageGroupe($user, $data);
        }
        break;
}

function getConversations($user) {
    $pdo = getDB();
    
    if ($user['role'] === 'admin') {
        $stmt = $pdo->query("
            SELECT DISTINCT 
                u.id as user_id,
                u.nom, u.prenom,
                (SELECT contenu FROM messages WHERE expediteur_id = u.id OR destinataire_id = u.id ORDER BY date_envoi DESC LIMIT 1) as dernier_message,
                (SELECT date_envoi FROM messages WHERE expediteur_id = u.id OR destinataire_id = u.id ORDER BY date_envoi DESC LIMIT 1) as date,
                (SELECT COUNT(*) FROM messages WHERE expediteur_id = u.id AND lu = 0) as non_lus
            FROM users u 
            WHERE u.role IN ('participant', 'correcteur')
            ORDER BY date DESC
        ");
    } else {
        $stmt = $pdo->prepare("
            SELECT m.*, u.nom, u.prenom 
            FROM messages m 
            JOIN users u ON m.expediteur_id = u.id 
            WHERE m.destinataire_id = ? 
            ORDER BY m.date_envoi DESC
        ");
        $stmt->execute([$user['userId']]);
    }
    
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

function envoyerMessage($user, $data) {
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO messages (expediteur_id, destinataire_id, type, sujet, contenu) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $user['userId'],
            $data['destinataire_id'],
            $data['type'] ?? 'prive',
            $data['sujet'],
            $data['contenu']
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Message envoyé']);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Erreur envoi message']);
    }
}

function envoyerMessageGroupe($user, $data) {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Accès refusé']);
        return;
    }
    
    $pdo = getDB();
    
    try {
        // Récupérer les destinataires selon le type
        if ($data['destinataire'] === 'tous') {
            $stmt = $pdo->query("SELECT id FROM users WHERE role IN ('participant', 'correcteur')");
        } elseif ($data['destinataire'] === 'participants') {
            $stmt = $pdo->query("SELECT id FROM users WHERE role = 'participant'");
        } elseif ($data['destinataire'] === 'correcteurs') {
            $stmt = $pdo->query("SELECT id FROM users WHERE role = 'correcteur'");
        }
        
        $destinataires = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Envoyer à chaque destinataire
        $stmt = $pdo->prepare("
            INSERT INTO messages (expediteur_id, destinataire_id, type, sujet, contenu) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        foreach ($destinataires as $dest_id) {
            $stmt->execute([
                $user['userId'],
                $dest_id,
                $data['type'],
                $data['sujet'],
                $data['contenu']
            ]);
        }
        
        echo json_encode(['success' => true, 'message' => 'Messages envoyés à ' . count($destinataires) . ' destinataires']);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Erreur envoi groupé']);
    }
}

function getTemplates() {
    $templates = [
        [
            'nom' => 'Confirmation inscription',
            'contenu' => 'Votre inscription au concours CP2i a été confirmée. Vous pouvez maintenant soumettre votre texte via votre tableau de bord.'
        ],
        [
            'nom' => 'Rappel soumission',
            'contenu' => 'N\'oubliez pas de soumettre votre texte avant la date limite. Il vous reste [X] jours pour finaliser votre participation.'
        ],
        [
            'nom' => 'Résultats disponibles',
            'contenu' => 'Les résultats de votre évaluation sont maintenant disponibles dans votre tableau de bord. Félicitations pour votre participation !'
        ],
        [
            'nom' => 'Correction terminée',
            'contenu' => 'Votre texte a été évalué par nos correcteurs. Vous pouvez consulter les commentaires et votre note dans votre espace personnel.'
        ]
    ];
    
    echo json_encode($templates);
}
?>