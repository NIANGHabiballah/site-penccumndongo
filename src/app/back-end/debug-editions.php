<?php
header('Content-Type: application/json');

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=u122559880_form_contact;charset=utf8',
        'u122559880_root',
        'Tafsir#27',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    echo json_encode(['error' => 'Connexion DB échouée: ' . $e->getMessage()]);
    exit;
}

// Total comptes par rôle
$total = $pdo->query("SELECT role, COUNT(*) as total FROM cp2i_users GROUP BY role")->fetchAll(PDO::FETCH_ASSOC);

// Comptes créés à partir du 02/11/2026 (4ème édition)
$edition4 = $pdo->query("SELECT COUNT(*) as total FROM cp2i_users WHERE role = 'participant' AND created_at >= '2026-11-02 00:00:00'")->fetch(PDO::FETCH_ASSOC);

// Comptes créés entre 03/11/2025 et 01/11/2026 (3ème édition)
$edition3 = $pdo->query("SELECT COUNT(*) as total FROM cp2i_users WHERE role = 'participant' AND created_at >= '2025-11-03 00:00:00' AND created_at < '2026-11-02 00:00:00'")->fetch(PDO::FETCH_ASSOC);

// Comptes créés avant 03/11/2025
$avant = $pdo->query("SELECT COUNT(*) as total FROM cp2i_users WHERE role = 'participant' AND created_at < '2025-11-03 00:00:00'")->fetch(PDO::FETCH_ASSOC);

// Les 10 derniers comptes créés avec leur date
$derniers = $pdo->query("SELECT id, prenom, nom, role, created_at FROM cp2i_users ORDER BY created_at DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);

// Date min et max des comptes participants
$minmax = $pdo->query("SELECT MIN(created_at) as premier_compte, MAX(created_at) as dernier_compte FROM cp2i_users WHERE role = 'participant'")->fetch(PDO::FETCH_ASSOC);

echo json_encode([
    'total_par_role'   => $total,
    'edition_4_depuis_02nov2026' => $edition4['total'],
    'edition_3_03nov2025_a_01nov2026' => $edition3['total'],
    'avant_edition_3'  => $avant['total'],
    'premier_compte'   => $minmax['premier_compte'],
    'dernier_compte'   => $minmax['dernier_compte'],
    'derniers_inscrits' => $derniers
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
