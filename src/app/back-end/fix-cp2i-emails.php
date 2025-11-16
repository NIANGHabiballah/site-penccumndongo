<?php
// Script pour corriger automatiquement les emails CP2i
echo "🔧 Correction des emails CP2i...\n";

// Liste des fichiers CP2i qui utilisent mail()
$filesToFix = [
    'cp2i-auth.php',
    'cp2i-participant.php', 
    'cp2i-correcteur.php',
    'cp2i-admin-stats.php',
    'cp2i-messages.php'
];

$fixedFiles = 0;

foreach ($filesToFix as $file) {
    if (file_exists($file)) {
        $content = file_get_contents($file);
        
        // Vérifier si le fichier contient mail()
        if (strpos($content, 'mail(') !== false) {
            // Ajouter l'include au début du fichier
            if (strpos($content, 'cp2i-smtp-fix.php') === false) {
                $content = str_replace('<?php', "<?php\nrequire_once 'cp2i-smtp-fix.php';", $content);
            }
            
            // Remplacer mail() par mail_smtp()
            $content = str_replace('mail(', 'mail_smtp(', $content);
            
            // Sauvegarder le fichier
            file_put_contents($file, $content);
            echo "✅ $file corrigé\n";
            $fixedFiles++;
        }
    }
}

echo "\n🎉 $fixedFiles fichiers corrigés !\n";
echo "📧 Les emails CP2i utilisent maintenant Gmail SMTP.\n";
?>