<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Configuration base de données
define('DB_HOST', 'localhost');
define('DB_NAME', 'u122559880_form_contact');
define('DB_USER', 'u122559880_root');
define('DB_PASS', 'Tafsir#27');

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    echo json_encode(['valid' => false, 'reason' => 'Erreur de connexion']);
    exit;
}

$code = $_GET['code'] ?? $_POST['code'] ?? null;

if (!$code) {
    echo json_encode(['valid' => false, 'reason' => 'Code manquant']);
    exit;
}

// Décoder le code unique : CP2i-[USER_ID]-2025-[HASH]
if (!preg_match('/^CP2i-(\d+)-2025-(.+)$/', $code, $matches)) {
    echo json_encode(['valid' => false, 'reason' => 'Format de code invalide. Le code doit être au format: CP2i-XX-2025-XXXXXXXX']);
    exit;
}

$user_id = $matches[1];
$hash = $matches[2];

try {
    // Récupérer les informations du participant
    $stmt = $pdo->prepare("
        SELECT u.nom, u.prenom, u.email, u.created_at,
               AVG(CAST(t.note AS DECIMAL(4,2))) as note_moyenne,
               COUNT(t.id) as total_textes,
               SUM(CASE WHEN t.statut = 'accepte' THEN 1 ELSE 0 END) as textes_acceptes
        FROM cp2i_users u 
        LEFT JOIN cp2i_textes t ON u.id = t.user_id 
        WHERE u.id = ? AND u.role = 'participant'
        GROUP BY u.id
    ");
    $stmt->execute([$user_id]);
    $participant = $stmt->fetch();
    
    if (!$participant) {
        echo json_encode(['valid' => false, 'reason' => 'Aucun participant trouvé avec cet ID. Vérifiez que le code est correct.']);
        exit;
    }
    
    // Vérification universelle - teste TOUS les formats possibles
    $note_raw = $participant['note_moyenne'];
    
    // Tous les formats de notes possibles
    $note_formats = ['null'];
    if ($note_raw) {
        $note_formats = [
            (string)$note_raw,                           // 18.000000
            number_format($note_raw, 1),                 // 18.0  
            rtrim(number_format($note_raw, 1), '0'),     // 18.
            rtrim(rtrim(number_format($note_raw, 1), '0'), '.'), // 18
            (string)round($note_raw, 1),                 // 18.5
            (string)round($note_raw),                    // 18
            (string)intval($note_raw)                    // 18
        ];
    }
    
    // Tous les formats de dates possibles
    $date_formats = [
        date('d M'),                    // 29 Oct
        date('d') . ' ' . strtolower(date('M')),  // 29 oct
        date('d') . ' ' . strtolower(date('M')[0]), // 29 o
        date('d') . ' ' . date('M')[0], // 29 O
        date('d M', strtotime($participant['created_at'])), // Date inscription
        date('d') . ' ' . strtolower(date('M', strtotime($participant['created_at']))),
        date('d') . ' ' . strtolower(date('M', strtotime($participant['created_at']))[0])
    ];
    
    $valid_hash = false;
    foreach ($note_formats as $note_str) {
        foreach ($date_formats as $date_str) {
            $test_data = $user_id . '-' . $note_str . '-' . $date_str;
            $test_hash = substr(base64_encode($test_data), 0, 16);
            if ($hash === $test_hash) {
                $valid_hash = true;
                break 2;
            }
        }
    }
    
    if (!$valid_hash) {
        echo json_encode([
            'valid' => false, 
            'reason' => 'Code de vérification incorrect. Ce code ne correspond pas aux données du participant ou a été modifié.'
        ]);
        exit;
    }
    
    // Enregistrer la vérification
    $pdo->prepare("INSERT INTO certificate_verifications (user_id, verification_code, verified_at) VALUES (?, ?, NOW())")
        ->execute([$user_id, $code]);
    
    // Compter les vérifications
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM certificate_verifications WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $verification_count = $stmt->fetch()['count'];
    
    echo json_encode([
        'valid' => true,
        'data' => [
            'participant_name' => $participant['prenom'] . ' ' . $participant['nom'],
            'concours_title' => 'Concours de Poésie CP2i 2025 - Édition 3',
            'organisateur' => 'Penccum Ndongo',
            'date_issued' => '2026-01-10',
            'date_inscription' => date('Y-m-d', strtotime($participant['created_at'])),
            'note_moyenne' => $participant['note_moyenne'] ? round($participant['note_moyenne'], 1) : null,
            'textes_acceptes' => $participant['textes_acceptes'],
            'total_textes' => $participant['total_textes'],
            'verified_count' => $verification_count,
            'ceremonie_date' => '10 janvier 2026'
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(['valid' => false, 'reason' => 'Erreur de vérification']);
}
?>