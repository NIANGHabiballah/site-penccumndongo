#!/bin/bash

echo "Configuration du serveur CP2i..."

# Installation de Node.js et npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation de MySQL
sudo apt update
sudo apt install -y mysql-server

# Configuration MySQL
sudo mysql -e "CREATE DATABASE cp2i_db;"
sudo mysql -e "CREATE USER 'cp2i_user'@'localhost' IDENTIFIED BY 'cp2i_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON cp2i_db.* TO 'cp2i_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Import du schéma
mysql -u cp2i_user -pcp2i_password cp2i_db < ../database/schema.sql

# Installation des dépendances
cd ..
npm install

# Configuration du service systemd
sudo tee /etc/systemd/system/cp2i-backend.service > /dev/null <<EOF
[Unit]
Description=CP2i Backend API
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/cp2i-backend
ExecStart=/usr/bin/node api/server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=DB_HOST=localhost
Environment=DB_USER=cp2i_user
Environment=DB_PASSWORD=cp2i_password
Environment=DB_NAME=cp2i_db
Environment=JWT_SECRET=production_jwt_secret_key
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Activation du service
sudo systemctl daemon-reload
sudo systemctl enable cp2i-backend
sudo systemctl start cp2i-backend

echo "Installation terminée. Backend disponible sur le port 3000"