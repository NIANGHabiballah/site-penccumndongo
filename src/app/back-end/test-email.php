<?php
// Test simple d'envoi d'email pour diagnostic
header('Content-Type: text/plain');

echo "=== TEST DE CONFIGURATION EMAIL ===\n\n";

// Vérifier la configuration PHP
echo "Configuration PHP:\n";
echo "- sendmail_path: " . (ini_get('sendmail_path') ?: 'NON DÉFINI') . "\n";
echo "- SMTP: " . (ini_get('SMTP') ?: 'NON DÉFINI') . "\n";
echo "- smtp_port: " . (ini_get('smtp_port') ?: 'NON DÉFINI') . "\n";
echo "- sendmail_from: " . (ini_get('sendmail_from') ?: 'NON DÉFINI') . "\n\n";

// Test d'envoi simple
$to = "pencc.penccumndongo@gmail.com"; // Remplacez par votre email de test
$subject = "Test Email - " . date('Y-m-d H:i:s');
$message = "Ceci est un test d'envoi d'email depuis le serveur.\n\nDate: " . date('Y-m-d H:i:s');
$headers = "From: Test <pencc.penccumndongo@gmail.com>\r\n";
$headers .= "Reply-To: pencc.penccumndongo@gmail.com\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

echo "Tentative d'envoi d'email de test...\n";
echo "Destinataire: $to\n";
echo "Sujet: $subject\n\n";

$result = mail($to, $subject, $message, $headers);

echo "Résultat: " . ($result ? "SUCCÈS" : "ÉCHEC") . "\n";

if (!$result) {
    $lastError = error_get_last();
    echo "Dernière erreur: " . ($lastError['message'] ?? 'Aucune erreur spécifique') . "\n";
}

echo "\n=== FIN DU TEST ===\n";
?>