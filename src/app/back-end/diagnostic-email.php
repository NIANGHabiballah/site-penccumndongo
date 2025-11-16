<?php
// Test de diagnostic email - NE MODIFIE RIEN
header('Content-Type: text/plain; charset=UTF-8');

echo "=== DIAGNOSTIC EMAIL PENCCUM NDONGO ===\n\n";

// 1. Test de la fonction mail() native
echo "1. TEST FONCTION MAIL() NATIVE:\n";
$testEmail = "pencc.penccumndongo@gmail.com";
$subject = "Test Diagnostic - " . date('H:i:s');
$message = "Test simple de la fonction mail() native";
$headers = "From: Test <pencc.penccumndongo@gmail.com>";

$result1 = mail($testEmail, $subject, $message, $headers);
echo "   Résultat: " . ($result1 ? "✅ SUCCÈS" : "❌ ÉCHEC") . "\n\n";

// 2. Test de la configuration PHP
echo "2. CONFIGURATION PHP:\n";
echo "   sendmail_path: " . (ini_get('sendmail_path') ?: 'NON DÉFINI') . "\n";
echo "   SMTP: " . (ini_get('SMTP') ?: 'NON DÉFINI') . "\n";
echo "   smtp_port: " . (ini_get('smtp_port') ?: 'NON DÉFINI') . "\n\n";

// 3. Test de l'existence des fichiers SMTP
echo "3. FICHIERS SMTP EXISTANTS:\n";
echo "   gmail-smtp.php: " . (file_exists('gmail-smtp.php') ? "✅ EXISTE" : "❌ MANQUANT") . "\n";
echo "   phpmailer/PHPMailer.php: " . (file_exists('phpmailer/PHPMailer.php') ? "✅ EXISTE" : "❌ MANQUANT") . "\n\n";

// 4. Test SMTP si disponible
if (file_exists('gmail-smtp.php') && file_exists('phpmailer/PHPMailer.php')) {
    echo "4. TEST SMTP GMAIL:\n";
    try {
        require_once 'gmail-smtp.php';
        $result2 = sendEmailViaSMTP($testEmail, $subject . " SMTP", $message . " via SMTP");
        echo "   Résultat SMTP: " . ($result2 ? "✅ SUCCÈS" : "❌ ÉCHEC") . "\n";
    } catch (Exception $e) {
        echo "   Erreur SMTP: " . $e->getMessage() . "\n";
    }
} else {
    echo "4. SMTP NON DISPONIBLE (fichiers manquants)\n";
}

echo "\n=== FIN DIAGNOSTIC ===\n";
?>