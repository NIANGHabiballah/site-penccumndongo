#!/bin/bash

# Script de déploiement CP2i Backend
echo "🚀 Déploiement du backend CP2i..."

# Vérifier si MySQL est installé
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Créer la base de données
echo "📊 Configuration de la base de données..."
mysql -u root -p < cp2i-database.sql

if [ $? -eq 0 ]; then
    echo "✅ Base de données créée avec succès"
else
    echo "❌ Erreur lors de la création de la base de données"
    exit 1
fi

# Vérifier les permissions des fichiers PHP
echo "🔐 Vérification des permissions..."
chmod 644 *.php
chmod 755 .

# Créer le fichier .htaccess pour la sécurité
cat > .htaccess << 'EOF'
# Protection des fichiers sensibles
<Files "config.php">
    Order allow,deny
    Deny from all
</Files>

<Files "*.sql">
    Order allow,deny
    Deny from all
</Files>

# Headers de sécurité
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"

# CORS pour l'API
Header always set Access-Control-Allow-Origin "https://penccumndongo.com"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"

# Gestion des requêtes OPTIONS
RewriteEngine On
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
EOF

echo "✅ Déploiement terminé avec succès!"
echo "🌐 L'API CP2i est maintenant disponible à l'adresse :"
echo "   https://penccumndongo.com/src/app/back-end/"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Vérifiez la configuration de la base de données dans config.php"
echo "   2. Testez les endpoints de l'API"
echo "   3. Configurez les certificats SSL si nécessaire"