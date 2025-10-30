CREATE TABLE IF NOT EXISTS qr_certificates (
    id VARCHAR(64) PRIMARY KEY,
    certificate_data TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_qr_expires ON qr_certificates(expires_at);
CREATE INDEX idx_qr_created ON qr_certificates(created_at);