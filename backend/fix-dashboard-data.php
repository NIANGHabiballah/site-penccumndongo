<?php
/**
 * Script de correction des données du tableau de bord
 * Corrige les incohérences entre les données affichées et les données réelles
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config/database.php';

function fixParticipantData($userId) {
    global $pdo;
    
    try {
        $pdo->beginTransaction();
        
        // 1. Vérifier et corriger les doublons de textes
        $stmt = $pdo->prepare("
            SELECT id, titre, contenu, created_at, COUNT(*) as count
            FROM textes 
            WHERE participant_id = ? 
            GROUP BY titre, LEFT(contenu, 100), DATE(created_at)
            HAVING count > 1
        ");
        $stmt->execute([$userId]);
        $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($duplicates as $duplicate) {
            // Garder le plus récent, supprimer les autres
            $stmt = $pdo->prepare("
                DELETE FROM textes 
                WHERE participant_id = ? 
                AND titre = ? 
                AND LEFT(contenu, 100) = LEFT(?, 100)
                AND DATE(created_at) = DATE(?)
                AND id != (
                    SELECT max_id FROM (
                        SELECT MAX(id) as max_id 
                        FROM textes 
                        WHERE participant_id = ? 
                        AND titre = ? 
                        AND LEFT(contenu, 100) = LEFT(?, 100)
                        AND DATE(created_at) = DATE(?)
                    ) as subquery
                )
            ");
            $stmt->execute([
                $userId, $duplicate['titre'], $duplicate['contenu'], $duplicate['created_at'],
                $userId, $duplicate['titre'], $duplicate['contenu'], $duplicate['created_at']
            ]);
        }
        
        // 2. Corriger les statuts incohérents
        $stmt = $pdo->prepare("
            UPDATE textes t
            LEFT JOIN corrections c ON t.id = c.texte_id
            SET t.statut = CASE 
                WHEN c.note IS NOT NULL AND c.note >= 10 THEN 'accepte'
                WHEN c.note IS NOT NULL AND c.note < 10 THEN 'refuse'
                WHEN c.id IS NOT NULL AND t.statut = 'brouillon' THEN 'en_attente'
                ELSE t.statut
            END,
            t.note = COALESCE(c.note, t.note),
            t.commentaire = COALESCE(c.commentaires, t.commentaire)
            WHERE t.participant_id = ?
        ");
        $stmt->execute([$userId]);
        
        // 3. Mettre à jour les flags de modification
        $stmt = $pdo->prepare("
            UPDATE textes t
            LEFT JOIN corrections c ON t.id = c.texte_id
            SET t.peut_modifier = CASE 
                WHEN t.statut = 'brouillon' THEN 1
                WHEN t.statut = 'en_attente' AND c.correcteur_id IS NULL THEN 1
                WHEN t.statut IN ('accepte', 'refuse') THEN 0
                ELSE 0
            END
            WHERE t.participant_id = ?
        ");
        $stmt->execute([$userId]);
        
        // 4. Récupérer les données corrigées
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_textes,
                COUNT(CASE WHEN statut = 'accepte' THEN 1 END) as textes_acceptes,
                COUNT(CASE WHEN statut = 'refuse' THEN 1 END) as textes_refuses,
                COUNT(CASE WHEN statut IN ('en_attente', 'brouillon') THEN 1 END) as textes_en_attente,
                AVG(CASE WHEN note IS NOT NULL THEN note END) as note_moyenne
            FROM textes 
            WHERE participant_id = ? AND deleted_at IS NULL
        ");
        $stmt->execute([$userId]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // 5. Récupérer les textes avec détails
        $stmt = $pdo->prepare("
            SELECT t.*, 
                   c.correcteur_id,
                   u.nom as correcteur_nom,
                   u.prenom as correcteur_prenom,
                   cor.note as correction_note,
                   cor.commentaires as correction_commentaire,
                   CASE 
                       WHEN t.statut = 'brouillon' THEN 1
                       WHEN t.statut = 'en_attente' AND c.correcteur_id IS NULL THEN 1
                       ELSE 0
                   END as peut_modifier
            FROM textes t
            LEFT JOIN corrections cor ON t.id = cor.texte_id
            LEFT JOIN users c ON cor.correcteur_id = c.id
            LEFT JOIN users u ON c.id = u.id
            WHERE t.participant_id = ? AND t.deleted_at IS NULL
            ORDER BY t.created_at DESC
        ");
        $stmt->execute([$userId]);
        $textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // 6. Marquer les messages anciens comme lus
        $stmt = $pdo->prepare("
            UPDATE messages 
            SET read_at = NOW() 
            WHERE (destinataire_id = ? OR destinataire_id IS NULL)
            AND read_at IS NULL 
            AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
        ");
        $stmt->execute([$userId]);
        
        // 7. Compter les messages non lus
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as unread_count
            FROM messages 
            WHERE (destinataire_id = ? OR destinataire_id IS NULL) 
            AND read_at IS NULL 
            AND deleted_at IS NULL
        ");
        $stmt->execute([$userId]);
        $messagesCount = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $pdo->commit();
        
        return [
            'success' => true,
            'message' => 'Données corrigées avec succès',
            'stats' => [
                'total_textes' => (int)$stats['total_textes'],
                'textes_acceptes' => (int)$stats['textes_acceptes'],
                'textes_refuses' => (int)$stats['textes_refuses'],
                'textes_en_attente' => (int)$stats['textes_en_attente'],
                'note_moyenne' => $stats['note_moyenne'] ? round($stats['note_moyenne'], 1) : null
            ],
            'textes' => $textes,
            'messages_non_lus' => (int)$messagesCount['unread_count'],
            'corrections_applied' => [
                'duplicates_removed' => count($duplicates),
                'statuts_corrected' => true,
                'modification_flags_updated' => true,
                'old_messages_marked_read' => true
            ]
        ];
        
    } catch (Exception $e) {
        $pdo->rollBack();
        return [
            'success' => false,
            'error' => 'Erreur lors de la correction des données: ' . $e->getMessage()
        ];
    }
}

function getCleanParticipantData($userId) {
    global $pdo;
    
    try {
        // Récupérer les données nettoyées sans modification
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_textes,
                COUNT(CASE WHEN statut = 'accepte' THEN 1 END) as textes_acceptes,
                COUNT(CASE WHEN statut = 'refuse' THEN 1 END) as textes_refuses,
                COUNT(CASE WHEN statut IN ('en_attente', 'brouillon') THEN 1 END) as textes_en_attente,
                AVG(CASE WHEN note IS NOT NULL THEN note END) as note_moyenne
            FROM textes 
            WHERE participant_id = ? AND deleted_at IS NULL
        ");
        $stmt->execute([$userId]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stmt = $pdo->prepare("
            SELECT t.*, 
                   c.correcteur_id,
                   CASE 
                       WHEN t.statut = 'brouillon' THEN 1
                       WHEN t.statut = 'en_attente' AND c.correcteur_id IS NULL THEN 1
                       ELSE 0
                   END as peut_modifier
            FROM textes t
            LEFT JOIN corrections c ON t.id = c.texte_id
            WHERE t.participant_id = ? AND t.deleted_at IS NULL
            ORDER BY t.created_at DESC
        ");
        $stmt->execute([$userId]);
        $textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
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
                'total_textes' => (int)$stats['total_textes'],
                'textes_acceptes' => (int)$stats['textes_acceptes'],
                'textes_refuses' => (int)$stats['textes_refuses'],
                'textes_en_attente' => (int)$stats['textes_en_attente'],
                'note_moyenne' => $stats['note_moyenne'] ? round($stats['note_moyenne'], 1) : null
            ],
            'textes' => $textes,
            'messages_non_lus' => (int)$messagesCount['unread_count']
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => 'Erreur lors de la récupération des données: ' . $e->getMessage()
        ];
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
$action = $_GET['action'] ?? 'get';

switch ($method) {
    case 'GET':
        if ($action === 'fix') {
            echo json_encode(fixParticipantData($userId));
        } else {
            echo json_encode(getCleanParticipantData($userId));
        }
        break;
        
    case 'POST':
        if ($action === 'fix') {
            echo json_encode(fixParticipantData($userId));
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Action non supportée']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Méthode non autorisée']);
        break;
}
?>