<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once 'config/database.php';

try {
    echo "=== MISE À JOUR DE LA TABLE CORRECTIONS ===\n\n";
    
    // 1. Ajouter les colonnes pour les notes par critère
    echo "1. Ajout des colonnes pour les notes par critère...\n";
    
    $alterSql = "
    ALTER TABLE corrections 
    ADD COLUMN IF NOT EXISTS note_pertinence DECIMAL(3,1) DEFAULT NULL COMMENT 'Note Pertinence sur 5',
    ADD COLUMN IF NOT EXISTS note_coherence DECIMAL(3,1) DEFAULT NULL COMMENT 'Note Cohérence sur 5', 
    ADD COLUMN IF NOT EXISTS note_correction DECIMAL(3,1) DEFAULT NULL COMMENT 'Note Correction de la langue sur 5',
    ADD COLUMN IF NOT EXISTS note_presentation DECIMAL(3,1) DEFAULT NULL COMMENT 'Note Présentation sur 5'
    ";
    
    $pdo->exec($alterSql);
    echo "✓ Colonnes ajoutées avec succès.\n\n";
    
    // 2. Mettre à jour les corrections existantes
    echo "2. Mise à jour des corrections existantes...\n";
    
    $updateSql = "
    UPDATE corrections 
    SET 
        note_pertinence = ROUND(note / 4, 1),
        note_coherence = ROUND(note / 4, 1), 
        note_correction = ROUND(note / 4, 1),
        note_presentation = ROUND(note / 4, 1)
    WHERE note IS NOT NULL AND note > 0 
    AND (note_pertinence IS NULL OR note_coherence IS NULL OR note_correction IS NULL OR note_presentation IS NULL)
    ";
    
    $stmt = $pdo->prepare($updateSql);
    $stmt->execute();
    
    echo "✓ " . $stmt->rowCount() . " corrections mises à jour.\n\n";
    
    // 3. Trouver Louise B. et créer/mettre à jour sa correction
    echo "3. Configuration de l'évaluation pour Louise B...\n";
    
    $stmt = $pdo->prepare("
        SELECT t.id, u.nom, u.prenom 
        FROM textes t 
        JOIN users u ON t.user_id = u.id 
        WHERE u.nom LIKE '%Louise%' OR u.prenom LIKE '%Louise%'
        LIMIT 1
    ");
    $stmt->execute();
    $texte = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($texte) {
        echo "✓ Texte trouvé: ID " . $texte['id'] . " pour " . $texte['prenom'] . " " . $texte['nom'] . "\n";
        
        // Vérifier s'il existe déjà une correction
        $stmt = $pdo->prepare("SELECT id FROM corrections WHERE texte_id = ?");
        $stmt->execute([$texte['id']]);
        $existingCorrection = $stmt->fetch();
        
        if ($existingCorrection) {
            // Mettre à jour la correction existante
            $stmt = $pdo->prepare("
                UPDATE corrections 
                SET 
                    note = 12.0,
                    note_pertinence = 3.0,
                    note_coherence = 3.0, 
                    note_correction = 3.0,
                    note_presentation = 3.0,
                    commentaire = 'Bon travail dans l''ensemble. Les critères sont bien respectés.',
                    statut = 'corrige',
                    date_correction = NOW()
                WHERE texte_id = ?
            ");
            $stmt->execute([$texte['id']]);
            echo "✓ Correction existante mise à jour.\n";
        } else {
            // Insérer une nouvelle correction
            $stmt = $pdo->prepare("
                INSERT INTO corrections 
                (texte_id, correcteur_id, note, note_pertinence, note_coherence, note_correction, note_presentation, commentaire, statut, date_correction)
                VALUES (?, 1, 12.0, 3.0, 3.0, 3.0, 3.0, 'Bon travail dans l''ensemble. Les critères sont bien respectés.', 'corrige', NOW())
            ");
            $stmt->execute([$texte['id']]);
            echo "✓ Nouvelle correction créée.\n";
        }
        
        // Mettre à jour aussi le texte principal
        $stmt = $pdo->prepare("
            UPDATE textes 
            SET note = 12.0, statut = 'accepte'
            WHERE id = ?
        ");
        $stmt->execute([$texte['id']]);
        
        echo "✓ Texte principal mis à jour (Note: 12/20, Statut: Admis).\n\n";
    } else {
        echo "⚠ Aucun texte trouvé pour Louise B.\n\n";
    }
    
    // 4. Vérifier la structure finale
    echo "4. Vérification de la structure finale...\n";
    
    $stmt = $pdo->query("DESCRIBE corrections");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $critereColumns = ['note_pertinence', 'note_coherence', 'note_correction', 'note_presentation'];
    $foundColumns = [];
    
    foreach ($columns as $column) {
        if (in_array($column['Field'], $critereColumns)) {
            $foundColumns[] = $column['Field'];
        }
    }
    
    echo "✓ Colonnes de critères trouvées: " . implode(', ', $foundColumns) . "\n";
    
    // 5. Test de récupération des données
    echo "\n5. Test de récupération des données...\n";
    
    if ($texte) {
        $stmt = $pdo->prepare("
            SELECT 
                c.*,
                u.nom as correcteur_nom,
                u.prenom as correcteur_prenom
            FROM corrections c
            LEFT JOIN users u ON c.correcteur_id = u.id
            WHERE c.texte_id = ?
        ");
        $stmt->execute([$texte['id']]);
        $correction = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($correction) {
            echo "✓ Données de test récupérées:\n";
            echo "  - Note totale: " . $correction['note'] . "/20\n";
            echo "  - Pertinence: " . $correction['note_pertinence'] . "/5\n";
            echo "  - Cohérence: " . $correction['note_coherence'] . "/5\n";
            echo "  - Correction: " . $correction['note_correction'] . "/5\n";
            echo "  - Présentation: " . $correction['note_presentation'] . "/5\n";
        }
    }
    
    echo "\n=== MISE À JOUR TERMINÉE AVEC SUCCÈS ===\n";
    
} catch (Exception $e) {
    echo "❌ ERREUR: " . $e->getMessage() . "\n";
}
?>