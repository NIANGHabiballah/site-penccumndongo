<?php
require_once 'config.php';
setCorsHeaders();

try {
    $db = getDB();
    
    // Vérifier si la table cp2i_affectations existe
    $stmt = $db->prepare("SHOW TABLES LIKE 'cp2i_affectations'");
    $stmt->execute();
    $tableExists = $stmt->fetch();
    
    echo "Table cp2i_affectations existe: " . ($tableExists ? "OUI" : "NON") . "\n";
    
    if ($tableExists) {
        // Compter les affectations
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM cp2i_affectations");
        $stmt->execute();
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Nombre d'affectations: " . $count['count'] . "\n";
        
        // Afficher quelques affectations
        $stmt = $db->prepare("SELECT * FROM cp2i_affectations LIMIT 5");
        $stmt->execute();
        $affectations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "Exemples d'affectations:\n";
        print_r($affectations);
    }
    
    // Vérifier les autres tables
    $tables = ['cp2i_users', 'cp2i_textes', 'cp2i_messages'];
    foreach ($tables as $table) {
        $stmt = $db->prepare("SHOW TABLES LIKE '$table'");
        $stmt->execute();
        $exists = $stmt->fetch();
        echo "Table $table existe: " . ($exists ? "OUI" : "NON") . "\n";
    }
    
} catch (Exception $e) {
    echo "ERREUR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
?>