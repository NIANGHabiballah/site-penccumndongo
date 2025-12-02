-- Table pour stocker les évaluations individuelles des correcteurs
CREATE TABLE IF NOT EXISTS evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    texte_id INT NOT NULL,
    correcteur_id INT NOT NULL,
    note DECIMAL(4,2) NULL,
    commentaire TEXT NULL,
    statut ENUM('en_attente', 'accepte', 'refuse') DEFAULT 'en_attente',
    date_evaluation TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (texte_id) REFERENCES textes(id) ON DELETE CASCADE,
    FOREIGN KEY (correcteur_id) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_evaluation (texte_id, correcteur_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_evaluations_texte ON evaluations(texte_id);
CREATE INDEX idx_evaluations_correcteur ON evaluations(texte_id, correcteur_id);