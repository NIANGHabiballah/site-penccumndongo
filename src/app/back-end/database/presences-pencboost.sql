-- Table des présences Penc'Boost
CREATE TABLE IF NOT EXISTS presences_pencboost (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    edition VARCHAR(10) NOT NULL DEFAULT '2026',
    nom_prenom VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telephone VARCHAR(30) NOT NULL,
    heure_arrivee VARCHAR(10) NOT NULL,
    statut_presence ENUM('present', 'retard') NOT NULL DEFAULT 'present',
    observations TEXT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_presence (email, module, edition)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
