<?php
require_once 'config/database.php';

try {
    // Trouver l'ID du texte de Louise B.
    $stmt = $pdo->prepare("
        SELECT t.id, u.nom, u.prenom 
        FROM textes t 
        JOIN users u ON t.user_id = u.id 
        WHERE u.nom LIKE '%Louise%' OR u.prenom LIKE '%Louise%'
        LIMIT 1
    ");
    $stmt->execute();
    $texte = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$texte) {
        echo "Aucun texte trouvé pour Louise B.\n";
        exit;
    }
    
    echo "Texte trouvé: ID " . $texte['id'] . " pour " . $texte['prenom'] . " " . $texte['nom'] . "\n";
    
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
        echo "Correction mise à jour avec les notes par critère.\n";
    } else {
        // Insérer une nouvelle correction
        $stmt = $pdo->prepare("
            INSERT INTO corrections 
            (texte_id, correcteur_id, note, note_pertinence, note_coherence, note_correction, note_presentation, commentaire, statut, date_correction)
            VALUES (?, 1, 12.0, 3.0, 3.0, 3.0, 3.0, 'Bon travail dans l''ensemble. Les critères sont bien respectés.', 'corrige', NOW())
        ");
        $stmt->execute([$texte['id']]);
        echo "Nouvelle correction insérée avec les notes par critère.\n";
    }
    
    // Mettre à jour aussi le texte principal
    $stmt = $pdo->prepare("
        UPDATE textes 
        SET note = 12.0, statut = 'corrige'
        WHERE id = ?
    ");
    $stmt->execute([$texte['id']]);
    
    echo "Données de test créées avec succès pour Louise B. (Note: 12/20)\n";
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}
?>