<?php
require_once 'config.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'current') {
            getReglementsCourants();
        }
        break;
    case 'POST':
        $user = verifyToken();
        if ($user['role'] === 'admin') {
            updateReglements(json_decode(file_get_contents("php://input"), true));
        } else {
            http_response_code(403);
            echo json_encode(['error' => 'Accès refusé']);
        }
        break;
}

function getReglementsCourants() {
    $reglements = [
        'edition' => '3ème',
        'annee' => '2025',
        'organisation' => [
            'nom' => 'Penccum Ndongo',
            'description' => 'La 3ème édition du Concours de Poésie Inédit et Innovant (CP2i) est organisée par Penccum Ndongo, une entreprise spécialisée dans la promotion des solutions numériques et l\'accompagnement des initiatives culturelles et créatives.',
            'objectif' => 'Cette année, le CP2i vise à offrir une plateforme d\'expression aux poètes, jeunes et confirmés, pour explorer et partager leur vision sur des thématiques d\'actualité.'
        ],
        'participation' => [
            'ouverture' => 'Le concours est ouvert à toute personne résidant au Sénégal et à l\'international.',
            'periode_inscription' => 'du 1er au 31 janvier 2025',
            'langues' => ['français', 'wolof', 'anglais', 'arabe'],
            'themes' => [
                'Femme Modèle',
                'Jeunesse et l\'Avenir', 
                'L\'Afrique de Demain',
                'Tendances et Valeurs',
                'L\'Influence des Réseaux Sociaux',
                'Innovation et Tradition',
                'Paix et Réconciliation'
            ]
        ],
        'soumission' => [
            'format' => 'Un seul poème par participant en format numérique',
            'limite_vers' => '40 vers maximum',
            'pages' => 'Tenir sur une seule page',
            'originalite' => 'Le texte doit être inédit, jamais publié ni présenté dans d\'autres concours',
            'informations_requises' => ['nom', 'prénom', 'adresse', 'numéro de téléphone', 'email', 'texte']
        ],
        'selection' => [
            'comite' => 'Les poèmes seront évalués par un comité de lecture composé d\'écrivains, d\'universitaires et de professionnels du milieu artistique et littéraire.',
            'criteres' => 'Les meilleurs textes dans chaque langue seront sélectionnés pour la finale.',
            'annonce_finalistes' => 'fin février 2025',
            'publication' => 'Les poèmes finalistes seront publiés sur nos plateformes sociales pour une phase d\'appréciation publique.',
            'mention_speciale' => 'Le poème le plus aimé et commenté recevra une mention spéciale.'
        ],
        'recompenses' => [
            'prix_par_langue' => 'Des prix seront attribués aux lauréats des différentes langues',
            'ceremonie' => 'Les poèmes sélectionnés pourront faire l\'objet de publications ou d\'interprétations lors de la cérémonie de remise des prix',
            'details' => 'Les détails sur les récompenses seront précisés lors de l\'annonce des finalistes'
        ],
        'conditions' => [
            'droits' => 'En participant au concours, les auteurs acceptent de céder leurs droits de reproduction et de diffusion à Penccum Ndongo',
            'utilisation' => 'Les participants autorisent l\'utilisation de leur nom, pseudonyme, image et textes sans contrepartie financière pour les actions liées au concours',
            'fraude' => 'Toute tentative de fraude entraînera l\'élimination immédiate du participant concerné',
            'respect' => 'Les textes doivent respecter les valeurs de respect, de tolérance et d\'inclusion'
        ],
        'contact' => [
            'email' => 'penc.pencumndongo@gmail.com',
            'site' => 'https://penccumndongo.com',
            'reseaux' => ['Facebook', 'Instagram', 'Twitter', 'LinkedIn']
        ],
        'nouveautes_2025' => [
            'theme_supplementaire' => 'Innovation et Tradition',
            'limite_vers_augmentee' => '40 vers (au lieu de 30)',
            'periode_prolongee' => 'Inscriptions prolongées jusqu\'au 31 janvier',
            'plateforme_numerique' => 'Soumission entièrement numérique via le site web',
            'suivi_temps_reel' => 'Suivi en temps réel du statut de participation'
        ]
    ];
    
    echo json_encode($reglements);
}

function updateReglements($data) {
    $pdo = getDB();
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO reglements_cp2i (edition, annee, contenu, date_mise_a_jour) 
            VALUES (?, ?, ?, NOW()) 
            ON DUPLICATE KEY UPDATE 
            contenu = VALUES(contenu), date_mise_a_jour = NOW()
        ");
        
        $stmt->execute([
            $data['edition'],
            $data['annee'],
            json_encode($data)
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Règlements mis à jour']);
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Erreur mise à jour règlements']);
    }
}
?>