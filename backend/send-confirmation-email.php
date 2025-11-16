<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['email']) || !isset($input['firstName']) || !isset($input['lastName'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Données manquantes']);
    exit;
}

$email = filter_var($input['email'], FILTER_VALIDATE_EMAIL);
$firstName = htmlspecialchars($input['firstName']);
$lastName = htmlspecialchars($input['lastName']);
$phone = htmlspecialchars($input['phone'] ?? '');

if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'Email invalide']);
    exit;
}

// Configuration email
$to = $email;
$subject = "✅ Inscription confirmée - Formation Infographie Cohorte 2";

// Template HTML personnalisé
$htmlMessage = "
<!DOCTYPE html>
<html lang='fr'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Confirmation d'inscription</title>
    <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css'>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1, .header p { color: white; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .success-badge { background-color: #10b981; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin-bottom: 20px; }
        .info-box { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; }
        .payment-info { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .contact-info { background-color: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { background-color: #1f2937; color: white; padding: 20px; text-align: center; }
        .btn { background-color: #3b82f6; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
        .highlight { color: #dc2626; font-weight: bold; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1><i class='fas fa-palette'></i> PENCCUM NDONGO</h1>
            <p>Formation Infographie Professionnelle</p>
        </div>
        
        <div class='content'>
            <div class='success-badge'><i class='fas fa-check-circle'></i> Inscription confirmée</div>
            
            <h2>Bonjour $firstName $lastName,</h2>
            
            <p>Félicitations ! Votre inscription à la <strong>Formation Infographie Cohorte 2</strong> a été reçue avec succès.</p>
            
            <div class='info-box'>
                <h3><i class='fas fa-clipboard-list'></i> Détails de votre inscription :</h3>
                <ul>
                    <li><strong>Nom complet :</strong> $firstName $lastName</li>
                    <li><strong>Email :</strong> $email</li>
                    <li><strong>Téléphone :</strong> $phone</li>
                    <li><strong>Formation :</strong> Infographie Professionnelle</li>
                    <li><strong>Modalité :</strong> 100% en ligne</li>
                    <li><strong>Durée :</strong> Du 1er au 31 décembre 2025</li>
                </ul>
            </div>
            
            <div class='payment-info'>
                <h3><i class='fas fa-money-bill-wave'></i> ÉTAPE SUIVANTE - PAIEMENT</h3>
                <p>Pour finaliser votre inscription, vous devez effectuer le paiement de votre première tranche :</p>
                <ul>
                    <li><strong>Montant :</strong> 15 000 FCFA (première tranche)</li>
                    <li><strong>Date limite :</strong> <span class='highlight'>29 novembre 2025</span></li>
                    <li><strong>Deuxième tranche :</strong> 15 000 FCFA (à payer à la fin de la formation avant la délivrance des attestations)</li>
                </ul>
                
                <h4><i class='fas fa-credit-card'></i> Moyens de paiement :</h4>
                <ul>
                    <li><strong>Orange Money :</strong> +221 77 629 06 39</li>
                    <li><strong>Wave :</strong> +221 77 629 06 39</li>
                    <li><strong>Free Money :</strong> +221 77 629 06 39</li>
                    <li><strong>Virement bancaire :</strong> Nous contacter</li>
                </ul>
                
                <p><strong><i class='fas fa-exclamation-triangle'></i> Important :</strong> Envoyez-nous une capture d'écran de votre paiement par WhatsApp pour confirmation.</p>
            </div>
            
            <div class='contact-info'>
                <h3><i class='fas fa-phone'></i> Contacts</h3>
                <ul>
                    <li><strong>WhatsApp :</strong> +221 77 629 06 39 / +221 76 841 54 14</li>
                    <li><strong>Email :</strong> pencc.penccumndongo@gmail.com</li>
                    <li><strong>Site web :</strong> penccumndongo.com</li>
                </ul>
                
                <a href='https://wa.me/221776290639?text=Bonjour PENCCUM NDONGO, je viens de finaliser mon inscription à la Formation Infographie Cohorte 2. Je vous envoie ma capture d%27écran de paiement de la première tranche (15 000 FCFA) pour validation. Merci.' class='btn'><i class='fab fa-whatsapp'></i> Envoyer capture de paiement</a>
                
                <a href='https://chat.whatsapp.com/I8O4QfOZ7CgIhvZS88VjVd' class='btn' style='background-color: #10b981; margin-top: 10px; display: block;'><i class='fas fa-users'></i> Rejoindre le groupe Formation Infographie</a>
            </div>
            
            <div class='info-box'>
                <h3><i class='fas fa-bullseye'></i> Ce qui vous attend :</h3>
                <ul>
                    <li>Formation complète sur Adobe Creative Suite</li>
                    <li>Projets pratiques et portfolio professionnel</li>
                    <li>Certificat de fin de formation</li>
                    <li>Accompagnement personnalisé</li>
                    <li>Accès à la communauté PENCCUM NDONGO</li>
                    <li><strong>Groupe WhatsApp dédié</strong> pour échanges et support</li>
                </ul>
            </div>
            
            <p><strong>Merci de votre confiance !</strong><br>
            L'équipe PENCCUM NDONGO vous accompagnera tout au long de votre parcours de formation.</p>
            
            <p>À très bientôt,<br>
            <strong>L'équipe PENCCUM NDONGO</strong></p>
        </div>
        
        <div class='footer'>
            <p>&copy; 2025 PENCCUM NDONGO - Agence de Marketing & Communication Digitale</p>
            <p>Yeumbeul Comico, Série B 156 - Dakar, Sénégal</p>
        </div>
    </div>
</body>
</html>
";

// Headers pour email HTML
$headers = [
    'MIME-Version: 1.0',
    'Content-type: text/html; charset=UTF-8',
    'From: PENCCUM NDONGO <pencc.penccumndongo@gmail.com>',
    'Reply-To: pencc.penccumndongo@gmail.com',
    'X-Mailer: PHP/' . phpversion()
];

// Envoyer l'email
$success = mail($to, $subject, $htmlMessage, implode("\r\n", $headers));

if ($success) {
    echo json_encode([
        'success' => true,
        'message' => 'Email de confirmation envoyé avec succès'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur lors de l\'envoi de l\'email',
        'success' => false
    ]);
}
?>