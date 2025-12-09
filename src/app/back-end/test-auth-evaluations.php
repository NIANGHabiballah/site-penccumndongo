<?php
require_once 'config.php';
setCorsHeaders();

// Test avec un utilisateur spécifique (ID 35 d'après les données fournies)
$testUserId = 35;

try {
    $pdo = getDB();
    
    echo "<h2>Test API Évaluations pour User ID: $testUserId</h2>";
    
    // Récupérer les évaluations pour les textes du participant
    $stmt = $pdo->prepare("
        SELECT 
            t.id as texte_id,
            t.titre,
            t.statut,
            e.pertinence,
            e.coherence,
            e.correction,
            e.presentation,
            e.note_totale,
            e.remarques
        FROM cp2i_textes t
        LEFT JOIN cp2i_evaluations e ON t.id = e.texte_id
        WHERE t.user_id = ?
        ORDER BY t.id, e.created_at
    ");
    
    $stmt->execute([$testUserId]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h3>Résultats bruts de la requête:</h3>";
    echo "<pre>" . print_r($results, true) . "</pre>";
    
    $textes = [];
    foreach ($results as $row) {
        $texteId = $row['texte_id'];
        
        if (!isset($textes[$texteId])) {
            $textes[$texteId] = [
                'id' => $row['texte_id'],
                'titre' => $row['titre'],
                'statut' => $row['statut'],
                'corrections' => []
            ];
        }
        
        if ($row['note_totale']) {
            $textes[$texteId]['corrections'][] = [
                'note_totale' => $row['note_totale'],
                'note_pertinence' => $row['pertinence'],
                'note_coherence' => $row['coherence'],
                'note_correction' => $row['correction'],
                'note_presentation' => $row['presentation'],
                'commentaires' => $row['remarques']
            ];
        }
    }
    
    $response = [
        'success' => true,
        'textes' => array_values($textes)
    ];
    
    echo "<h3>Réponse API formatée:</h3>";
    echo "<pre>" . json_encode($response, JSON_PRETTY_PRINT) . "</pre>";
    
    // Vérifier si ce participant a des évaluations
    $hasEvaluations = false;
    foreach ($textes as $texte) {
        if (!empty($texte['corrections'])) {
            $hasEvaluations = true;
            break;
        }
    }
    
    echo "<h3>Statut:</h3>";
    echo "<p>Participant a des évaluations: " . ($hasEvaluations ? "OUI" : "NON") . "</p>";
    echo "<p>Nombre de textes: " . count($textes) . "</p>";
    
    foreach ($textes as $texte) {
        echo "<p>Texte '{$texte['titre']}': " . count($texte['corrections']) . " correction(s)</p>";
    }
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage();
}
?>