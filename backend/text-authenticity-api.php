<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

try {
    if ($method === 'POST' && strpos($path, '/check-text-similarity') !== false) {
        checkTextSimilarity();
    } elseif ($method === 'POST' && strpos($path, '/save-authenticity-result') !== false) {
        saveAuthenticityResult();
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint non trouvé']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function checkTextSimilarity() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    $text = $input['text'] ?? '';
    $participantId = $input['participantId'] ?? null;
    
    if (empty($text)) {
        http_response_code(400);
        echo json_encode(['error' => 'Texte requis']);
        return;
    }
    
    $similarTexts = [];
    $score = 100;
    
    // 1. Vérifier contre textes de référence
    $stmt = $pdo->prepare("
        SELECT title, author, content, 
               MATCH(content, title, author) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
        FROM reference_texts 
        WHERE MATCH(content, title, author) AGAINST(? IN NATURAL LANGUAGE MODE)
        ORDER BY relevance DESC 
        LIMIT 5
    ");
    $stmt->execute([$text, $text]);
    $referenceMatches = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($referenceMatches as $match) {
        if ($match['relevance'] > 0.5) {
            $similarity = calculateSimilarity($text, $match['content']);
            if ($similarity > 0.3) {
                $similarTexts[] = [
                    'title' => $match['title'] . ' - ' . $match['author'],
                    'similarity' => round($similarity * 100),
                    'type' => 'reference'
                ];
                $score -= ($similarity * 50);
            }
        }
    }
    
    // 2. Vérifier contre autres textes CP2i
    $stmt = $pdo->prepare("
        SELECT t.id, t.titre, t.contenu, u.nom, u.prenom
        FROM cp2i_textes t 
        JOIN cp2i_users u ON t.participant_id = u.id 
        WHERE t.participant_id != ? OR ? IS NULL
        ORDER BY t.created_at DESC 
        LIMIT 50
    ");
    $stmt->execute([$participantId, $participantId]);
    $cp2iTexts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($cp2iTexts as $cp2iText) {
        $similarity = calculateSimilarity($text, $cp2iText['contenu']);
        if ($similarity > 0.4) {
            $similarTexts[] = [
                'title' => $cp2iText['titre'] . ' - ' . $cp2iText['nom'] . ' ' . $cp2iText['prenom'],
                'similarity' => round($similarity * 100),
                'type' => 'cp2i',
                'text_id' => $cp2iText['id']
            ];
            $score -= ($similarity * 60);
        }
    }
    
    // 3. Vérifier phrases communes suspectes
    $suspiciousPhrases = [
        'demain dès l\'aube', 'à l\'heure où blanchit', 'liberté j\'écris ton nom',
        'heureux qui comme ulysse', 'sur mes cahiers d\'écolier'
    ];
    
    foreach ($suspiciousPhrases as $phrase) {
        if (stripos($text, $phrase) !== false) {
            $similarTexts[] = [
                'title' => 'Phrase littéraire connue détectée',
                'similarity' => 95,
                'type' => 'known_phrase',
                'phrase' => $phrase
            ];
            $score -= 40;
        }
    }
    
    echo json_encode([
        'score' => max(0, $score),
        'similarTexts' => $similarTexts
    ]);
}

function saveAuthenticityResult() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    $textId = $input['textId'] ?? null;
    $result = $input['result'] ?? null;
    
    if (!$textId || !$result) {
        http_response_code(400);
        echo json_encode(['error' => 'Données manquantes']);
        return;
    }
    
    try {
        $pdo->beginTransaction();
        
        // Sauvegarder le résultat principal
        $stmt = $pdo->prepare("
            INSERT INTO text_authenticity_results 
            (text_id, participant_id, suspicion_score, ai_score, plagiarism_score, 
             internal_score, recommendation, details, ai_indicators, plagiarism_matches, similar_texts)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $textId,
            $result['participantId'] ?? null,
            $result['suspicionScore'],
            $result['aiDetection']['score'],
            $result['plagiarismCheck']['score'],
            $result['internalCheck']['score'],
            $result['recommendation'],
            $result['details'],
            json_encode($result['aiDetection']['indicators']),
            json_encode($result['plagiarismCheck']['matches']),
            json_encode($result['internalCheck']['similarTexts'])
        ]);
        
        $authenticityResultId = $pdo->lastInsertId();
        
        // Sauvegarder les correspondances de plagiat
        if (!empty($result['plagiarismCheck']['matches'])) {
            $stmt = $pdo->prepare("
                INSERT INTO plagiarism_matches 
                (authenticity_result_id, matched_phrase, source_description, similarity_percentage, match_type)
                VALUES (?, ?, ?, ?, ?)
            ");
            
            foreach ($result['plagiarismCheck']['matches'] as $match) {
                $stmt->execute([
                    $authenticityResultId,
                    $match['phrase'] ?? '',
                    $match['source'] ?? '',
                    $match['similarity'] ?? 0,
                    'EXTERNAL'
                ]);
            }
        }
        
        // Mettre à jour le statut du texte
        $status = 'VERIFIE';
        if ($result['recommendation'] === 'REJECT') $status = 'REJETE';
        elseif ($result['recommendation'] === 'REVIEW') $status = 'SUSPECT';
        
        $stmt = $pdo->prepare("
            UPDATE cp2i_textes 
            SET authenticity_status = ?, authenticity_score = ?, last_authenticity_check = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$status, $result['suspicionScore'], $textId]);
        
        $pdo->commit();
        
        echo json_encode(['success' => true, 'id' => $authenticityResultId]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function calculateSimilarity($text1, $text2) {
    // Nettoyage des textes
    $clean1 = strtolower(preg_replace('/[^\p{L}\s]/u', '', $text1));
    $clean2 = strtolower(preg_replace('/[^\p{L}\s]/u', '', $text2));
    
    $words1 = array_filter(explode(' ', $clean1));
    $words2 = array_filter(explode(' ', $clean2));
    
    if (empty($words1) || empty($words2)) return 0;
    
    // Similarité par mots communs
    $commonWords = array_intersect($words1, $words2);
    $wordSimilarity = count($commonWords) / max(count($words1), count($words2));
    
    // Similarité par phrases (séquences de 4 mots)
    $phrases1 = [];
    $phrases2 = [];
    
    for ($i = 0; $i <= count($words1) - 4; $i++) {
        $phrases1[] = implode(' ', array_slice($words1, $i, 4));
    }
    
    for ($i = 0; $i <= count($words2) - 4; $i++) {
        $phrases2[] = implode(' ', array_slice($words2, $i, 4));
    }
    
    $commonPhrases = array_intersect($phrases1, $phrases2);
    $phraseSimilarity = empty($phrases1) ? 0 : count($commonPhrases) / max(count($phrases1), count($phrases2));
    
    // Score final pondéré
    return ($wordSimilarity * 0.4) + ($phraseSimilarity * 0.6);
}
?>