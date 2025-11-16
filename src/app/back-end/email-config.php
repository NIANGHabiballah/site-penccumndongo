<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Configuration email SMTP
function sendEmail($to, $subject, $htmlMessage, $fromName = 'PENCCUM NDONGO') {
    require_once 'vendor/autoload.php';
    
    $mail = new PHPMailer(true);
    
    try {
        // Configuration SMTP
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'pencc.penccumndongo@gmail.com';
        $mail->Password = 'your_app_password_here'; // À remplacer par le mot de passe d'application Gmail
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;
        $mail->CharSet = 'UTF-8';
        
        // Expéditeur et destinataire
        $mail->setFrom('pencc.penccumndongo@gmail.com', $fromName);
        $mail->addAddress($to);
        $mail->addReplyTo('pencc.penccumndongo@gmail.com', $fromName);
        
        // Contenu
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $htmlMessage;
        
        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Erreur email: {$mail->ErrorInfo}");
        return false;
    }
}

// Fonction de fallback avec mail() PHP natif
function sendEmailFallback($to, $subject, $htmlMessage, $fromName = 'PENCCUM NDONGO') {
    $headers = implode("\r\n", [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        "From: $fromName <pencc.penccumndongo@gmail.com>",
        'Reply-To: pencc.penccumndongo@gmail.com'
    ]);
    
    return mail($to, $subject, $htmlMessage, $headers);
}

// Fonction principale d'envoi avec fallback
function sendEmailWithFallback($to, $subject, $htmlMessage, $fromName = 'PENCCUM NDONGO') {
    // Essayer d'abord PHPMailer si disponible
    if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        $result = sendEmail($to, $subject, $htmlMessage, $fromName);
        if ($result) {
            error_log("Email envoyé avec PHPMailer à: $to");
            return true;
        }
        error_log("PHPMailer a échoué, tentative avec mail() natif");
    }
    
    // Fallback avec mail() natif
    $result = sendEmailFallback($to, $subject, $htmlMessage, $fromName);
    error_log("Email envoyé avec mail() natif à $to: " . ($result ? 'SUCCÈS' : 'ÉCHEC'));
    return $result;
}
?>