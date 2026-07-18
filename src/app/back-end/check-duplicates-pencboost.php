<?php
header('Content-Type: text/html; charset=utf-8');

$admin_key = $_GET['admin_key'] ?? '';
if ($admin_key !== 'PencBoostAdmin2026') { echo 'Accès refusé'; exit; }

try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=u122559880_form_contact;charset=utf8',
        'u122559880_root',
        'Tafsir#27',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) { echo 'Erreur DB'; exit; }

// Participants inscrits sur plusieurs modules
$stmt = $pdo->query("
    SELECT email, nom, COUNT(*) as nb_modules, GROUP_CONCAT(module ORDER BY date_inscription SEPARATOR ' | ') as modules
    FROM inscriptions_pencboost
    GROUP BY email
    HAVING COUNT(*) > 1
    ORDER BY nb_modules DESC
");
$doublons = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "<h2>Participants inscrits sur plusieurs modules (" . count($doublons) . ")</h2>";
echo "<table border='1' cellpadding='6' style='border-collapse:collapse;font-family:Arial;font-size:13px'>";
echo "<tr style='background:#0380C2;color:white'><th>#</th><th>Nom</th><th>Email</th><th>Nb modules</th><th>Modules</th></tr>";
foreach ($doublons as $i => $d) {
    echo "<tr>";
    echo "<td>" . ($i+1) . "</td>";
    echo "<td>" . htmlspecialchars($d['nom']) . "</td>";
    echo "<td>" . htmlspecialchars($d['email']) . "</td>";
    echo "<td style='text-align:center;font-weight:bold;color:red'>" . $d['nb_modules'] . "</td>";
    echo "<td>" . htmlspecialchars($d['modules']) . "</td>";
    echo "</tr>";
}
echo "</table>";
echo "<br><strong>Total inscrits uniques avec doublons : " . count($doublons) . "</strong>";
?>
