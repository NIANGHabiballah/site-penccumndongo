<?php
// Debug direct de l'API
require_once 'config.php';

header('Content-Type: text/html');
echo "<h2>Debug API Response</h2>";

// Test sans auth d'abord
try {
    $pdo = getDB();
    
    // Trouver un utilisateur avec des évaluations
    $stmt = $pdo->prepare("
        SELECT DISTINCT t.user_id, t.id, t.titre, COUNT(e.id) as nb_eval
        FROM cp2i_textes t 
        LEFT JOIN cp2i_evaluations e ON t.id = e.texte_id 
        WHERE e.id IS NOT NULL
        GROUP BY t.user_id, t.id
        HAVING nb_eval > 0
        LIMIT 5
    ");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h3>Utilisateurs avec évaluations:</h3>";
    foreach ($users as $user) {
        echo "<p>User {$user['user_id']}: Texte '{$user['titre']}' - {$user['nb_eval']} évaluation(s)</p>";
        echo "<a href='?test_user={$user['user_id']}' target='_blank'>Tester cet utilisateur</a><br>";
    }
    
    // Si un utilisateur est sélectionné pour test
    if (isset($_GET['test_user'])) {
        $testUserId = intval($_GET['test_user']);
        echo "<hr><h3>Test pour utilisateur $testUserId:</h3>";
        
        // Simuler l'API
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
        
        $textes = [];
        foreach ($results as $row) {
            $texteId = $row['texte_id'];
            
            if (!isset($textes[$texteId])) {
                $textes[$texteId] = [
                    'id' => $texteId,
                    'titre' => $row['titre'],
                    'statut' => $row['statut'],
                    'corrections' => []
                ];
            }
            
            if ($row['note_totale']) {
                $textes[$texteId]['corrections'][] = [
                    'note_totale' => floatval($row['note_totale']),
                    'note_pertinence' => intval($row['pertinence']),
                    'note_coherence' => intval($row['coherence']),
                    'note_correction' => intval($row['correction']),
                    'note_presentation' => intval($row['presentation']),
                    'commentaires' => $row['remarques']
                ];
            }
        }
        
        $response = [
            'success' => true,
            'textes' => array_values($textes)
        ];
        
        echo "<h4>Réponse JSON:</h4>";
        echo "<pre>" . json_encode($response, JSON_PRETTY_PRINT) . "</pre>";
        
        echo "<h4>Test Angular:</h4>";
        echo "<script>
        fetch('get-evaluations-direct.php', {
            headers: {
                'Authorization': 'Bearer test.token.here',
                'Content-Type': 'application/json'
            }
        })
        .then(r => r.text())
        .then(data => {
            document.getElementById('angular-result').innerHTML = '<pre>' + data + '</pre>';
        })
        .catch(e => {
            document.getElementById('angular-result').innerHTML = 'Erreur: ' + e.message;
        });
        </script>";
        echo "<div id='angular-result'>Chargement...</div>";
    }
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage();
}
?>