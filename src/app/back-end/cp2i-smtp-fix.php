<?php
// Fichier de correction SMTP pour CP2i
// À inclure dans tous les fichiers CP2i qui envoient des emails

require_once 'gmail-smtp.php';

// Fonction de remplacement pour mail()
function mail_smtp($to, $subject, $message, $headers = '') {
    // Extraire le nom de l'expéditeur depuis les headers si présent
    $fromName = 'PENCCUM NDONGO CP2i';
    if (strpos($headers, 'From:') !== false) {
        preg_match('/From:.*?<.*?>/i', $headers, $matches);
        if (!empty($matches[0])) {
            preg_match('/From:\s*([^<]+)/i', $matches[0], $nameMatch);
            if (!empty($nameMatch[1])) {
                $fromName = trim($nameMatch[1]);
            }
        }
    }
    
    // Utiliser Gmail SMTP au lieu de mail()
    return sendEmailViaSMTP($to, $subject, $message, $fromName);
}

// Remplacer la fonction mail() globalement
if (!function_exists('mail_original')) {
    function mail_original($to, $subject, $message, $headers = '') {
        return mail_smtp($to, $subject, $message, $headers);
    }
}
?>