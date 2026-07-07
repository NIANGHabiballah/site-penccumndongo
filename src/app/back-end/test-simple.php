<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

echo json_encode([
    'success' => true,
    'textes' => [
        [
            'id' => 69,
            'titre' => 'Ndaw lu mat a yaakaar',
            'statut' => 'accepte',
            'corrections' => [
                [
                    'note_totale' => 16,
                    'note_pertinence' => 4,
                    'note_coherence' => 4,
                    'note_correction' => 4,
                    'note_presentation' => 4,
                    'commentaires' => 'Bon travail',
                    'date_correction' => '2024-12-01 10:00:00'
                ],
                [
                    'note_totale' => 17,
                    'note_pertinence' => 4,
                    'note_coherence' => 4,
                    'note_correction' => 4,
                    'note_presentation' => 5,
                    'commentaires' => 'Très bien',
                    'date_correction' => '2024-12-01 11:00:00'
                ],
                [
                    'note_totale' => 17,
                    'note_pertinence' => 4,
                    'note_coherence' => 4,
                    'note_correction' => 5,
                    'note_presentation' => 4,
                    'commentaires' => 'Excellent',
                    'date_correction' => '2024-12-01 12:00:00'
                ]
            ]
        ]
    ]
]);
?>