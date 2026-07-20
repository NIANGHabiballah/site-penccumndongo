<?php
// Configuration Gmail SMTP pour CP2i
require_once 'phpmailer/PHPMailer.php';
require_once 'phpmailer/SMTP.php';
require_once 'phpmailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

function sendEmailViaSMTP($to, $subject, $htmlMessage, $fromName = 'PENCCUM NDONGO') {
    $mail = new PHPMailer(true);
    
    try {
        // Configuration SMTP Gmail
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'pencc.penccumndongo@gmail.com';
        $mail->Password = 'fikw tvce imxu nnlo'; // Mot de passe d'application Gmail
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;
        
        // Expéditeur et destinataire
        $mail->setFrom('pencc.penccumndongo@gmail.com', $fromName);
        $mail->addAddress($to);
        
        // Contenu
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $htmlMessage;
        $mail->CharSet = 'UTF-8';
        
        $mail->send();
        return true;
        
    } catch (Exception $e) {
        $errorDetail = $mail->ErrorInfo;
        error_log("Erreur SMTP [{$to}]: " . $errorDetail);
        return $errorDetail;
    }
}

// Test de la fonction
if (isset($_GET['test'])) {
    $result = sendEmailViaSMTP(
        'pencc.penccumndongo@gmail.com', 
        'Test SMTP PENCCUM NDONGO', 
        '<h1>Test réussi!</h1><p>Les emails SMTP fonctionnent parfaitement.</p>'
    );
    echo $result ? '✅ Email envoyé!' : '❌ Erreur d\'envoi';
}
?>