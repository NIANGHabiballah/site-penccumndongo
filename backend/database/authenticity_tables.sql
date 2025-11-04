-- Tables pour le système de vérification d'authenticité CP2i

-- Table pour stocker les résultats d'analyse d'authenticité
CREATE TABLE IF NOT EXISTS text_authenticity_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text_id INT NOT NULL,
    participant_id INT,
    suspicion_score INT NOT NULL DEFAULT 0,
    ai_score INT NOT NULL DEFAULT 100,
    plagiarism_score INT NOT NULL DEFAULT 100,
    internal_score INT NOT NULL DEFAULT 100,
    recommendation ENUM('ACCEPT', 'REVIEW', 'REJECT') NOT NULL DEFAULT 'REVIEW',
    details TEXT,
    ai_indicators JSON,
    plagiarism_matches JSON,
    similar_texts JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (text_id) REFERENCES textes(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL,
    INDEX idx_text_id (text_id),
    INDEX idx_participant_id (participant_id),
    INDEX idx_recommendation (recommendation),
    INDEX idx_suspicion_score (suspicion_score)
);

-- Table pour stocker les correspondances de plagiat détectées
CREATE TABLE IF NOT EXISTS plagiarism_matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    authenticity_result_id INT NOT NULL,
    matched_phrase TEXT NOT NULL,
    source_description VARCHAR(500),
    similarity_percentage INT NOT NULL DEFAULT 0,
    match_type ENUM('INTERNAL', 'EXTERNAL', 'KNOWN_TEXT') NOT NULL DEFAULT 'EXTERNAL',
    source_text_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (authenticity_result_id) REFERENCES text_authenticity_results(id) ON DELETE CASCADE,
    FOREIGN KEY (source_text_id) REFERENCES textes(id) ON DELETE SET NULL,
    INDEX idx_authenticity_result (authenticity_result_id),
    INDEX idx_similarity (similarity_percentage),
    INDEX idx_match_type (match_type)
);

-- Table pour stocker les textes de référence
CREATE TABLE IF NOT EXISTS reference_texts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    content TEXT NOT NULL,
    source_type ENUM('LITERATURE', 'POETRY', 'ACADEMIC', 'WEB') NOT NULL DEFAULT 'LITERATURE',
    language VARCHAR(50) DEFAULT 'francais',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_source_type (source_type),
    INDEX idx_language (language),
    FULLTEXT idx_content (content, title, author)
);

-- Insérer textes de référence
INSERT INTO reference_texts (title, author, content, source_type, language) VALUES
('Demain dès l\'aube', 'Victor Hugo', 'Demain, dès l\'aube, à l\'heure où blanchit la campagne, Je partirai. Vois-tu, je sais que tu m\'attends. J\'irai par la forêt, j\'irai par la montagne. Je ne puis demeurer loin de toi plus longtemps.', 'POETRY', 'francais'),
('Liberté', 'Paul Éluard', 'Sur mes cahiers d\'écolier Sur mon pupitre et les arbres Sur le sable sur la neige J\'écris ton nom', 'POETRY', 'francais'),
('L\'Olive', 'Joachim du Bellay', 'Heureux qui, comme Ulysse, a fait un beau voyage, Ou comme cestuy-là qui conquit la toison, Et puis est retourné, plein d\'usage et raison, Vivre entre ses parents le reste de son âge !', 'POETRY', 'francais');

-- Ajouter colonnes authenticité à la table textes
ALTER TABLE textes ADD COLUMN IF NOT EXISTS authenticity_status ENUM('PENDING', 'VERIFIED', 'SUSPICIOUS', 'REJECTED') DEFAULT 'PENDING';
ALTER TABLE textes ADD COLUMN IF NOT EXISTS authenticity_score INT DEFAULT NULL;
ALTER TABLE textes ADD COLUMN IF NOT EXISTS last_authenticity_check TIMESTAMP NULL;