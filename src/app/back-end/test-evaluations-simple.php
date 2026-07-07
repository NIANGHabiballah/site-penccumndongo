<?php
require_once 'config.php';
setCorsHeaders();

// Test simple sans authentification pour déboguer
try {
    $pdo = getDB();
    
    // Test 1: Vérifier les textes existants
    echo "<h2>Test 1: Textes existants</h2>";
    $stmt = $pdo->prepare("SELECT id, user_id, titre FROM cp2i_textes LIMIT 5");
    $stmt->execute();
    $textes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>" . print_r($textes, true) . "</pre>";
    
    // Test 2: Vérifier les évaluations pour un texte spécifique
    if (!empty($textes)) {
        $texteId = $textes[0]['id'];
        echo "<h2>Test 2: Évaluations pour texte ID $texteId</h2>";
        $stmt = $pdo->prepare("
            SELECT 
                e.texte_id,
                e.correcteur_id,
                e.pertinence,
                e.coherence,
                e.correction,
                e.presentation,
                e.note_totale,
                e.remarques
            FROM cp2i_evaluations e
            WHERE e.texte_id = ?
        ");
        $stmt->execute([$texteId]);
        $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "<pre>" . print_r($evaluations, true) . "</pre>";
        
        // Test 3: Structure complète comme dans l'API
        echo "<h2>Test 3: Structure API complète</h2>";
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
            WHERE t.id = ?
            ORDER BY e.created_at
        ");
        $stmt->execute([$texteId]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $texte = [
            'id' => $texteId,
            'titre' => $results[0]['titre'] ?? 'Titre inconnu',
            'statut' => $results[0]['statut'] ?? 'en_attente',
            'corrections' => []
        ];
        
        foreach ($results as $row) {
            if ($row['note_totale']) {
                $texte['corrections'][] = [
                    'note_totale' => $row['note_totale'],
                    'note_pertinence' => $row['pertinence'],
                    'note_coherence' => $row['coherence'],
                    'note_correction' => $row['correction'],
                    'note_presentation' => $row['presentation'],
                    'commentaires' => $row['remarques']
                ];
            }
        }
        
        echo "<pre>" . print_r($texte, true) . "</pre>";
    }
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage();
}
?>