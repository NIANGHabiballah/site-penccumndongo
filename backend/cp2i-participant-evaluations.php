<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config/database.php';

$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'Token manquant']);
    exit;
}

$token = $matches[1];
$tokenParts = explode('.', $token);
$payload = json_decode(base64_decode($tokenParts[1]), true);
$userId = $payload['userId'];

try {
    $stmt = $pdo->prepare("
        SELECT 
            t.id,
            t.titre,
            t.statut,
            t.note,
            t.commentaire,
            c.note as correction_note,
            c.commentaires,
            c.criteres,
            c.date_correction,
            u.nom as correcteur_nom,
            u.prenom as correcteur_prenom
        FROM textes t
        LEFT JOIN corrections c ON t.id = c.texte_id
        LEFT JOIN users u ON c.correcteur_id = u.id
        WHERE t.participant_id = ?
        ORDER BY t.id, c.date_correction
    ");
    
    $stmt->execute([$userId]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $textes = [];
    foreach ($results as $row) {
        $texteId = $row['id'];
        
        if (!isset($textes[$texteId])) {
            $textes[$texteId] = [
                'id' => $row['id'],
                'titre' => $row['titre'],
                'statut' => $row['statut'],
                'note' => $row['note'],
                'commentaire' => $row['commentaire'],
                'corrections' => []
            ];
        }
        
        if ($row['correction_note']) {
            $criteres = $row['criteres'] ? json_decode($row['criteres'], true) : null;
            
            $textes[$texteId]['corrections'][] = [
                'note' => $row['correction_note'],
                'commentaires' => $row['commentaires'],
                'criteres' => $criteres,
                'date_correction' => $row['date_correction'],
                'correcteur_nom' => $row['correcteur_nom'],
                'correcteur_prenom' => $row['correcteur_prenom']
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'textes' => array_values($textes)
    ]);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>