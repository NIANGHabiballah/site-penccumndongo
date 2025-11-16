<?php
// Script d'installation automatique de PHPMailer
echo "Installation de PHPMailer...\n";

// Créer le dossier vendor s'il n'existe pas
if (!is_dir('vendor')) {
    mkdir('vendor', 0755, true);
}

// Télécharger PHPMailer depuis GitHub
$phpmailerUrl = 'https://github.com/PHPMailer/PHPMailer/archive/refs/tags/v6.8.1.zip';
$zipFile = 'phpmailer.zip';

// Télécharger le fichier
$zipContent = file_get_contents($phpmailerUrl);
if ($zipContent === false) {
    die("Erreur: Impossible de télécharger PHPMailer\n");
}

file_put_contents($zipFile, $zipContent);

// Extraire le ZIP
$zip = new ZipArchive;
if ($zip->open($zipFile) === TRUE) {
    $zip->extractTo('vendor/');
    $zip->close();
    
    // Renommer le dossier
    if (is_dir('vendor/PHPMailer-6.8.1')) {
        rename('vendor/PHPMailer-6.8.1', 'vendor/phpmailer');
    }
    
    unlink($zipFile);
    echo "✅ PHPMailer installé avec succès!\n";
} else {
    die("❌ Erreur: Impossible d'extraire PHPMailer\n");
}
?>