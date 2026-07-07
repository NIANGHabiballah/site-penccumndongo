# Guide de Déploiement CP2i

## Structure Backend Créée

```
backend/
├── api/
│   └── server.js          # Serveur Express avec toutes les routes
├── config/
│   └── database.js        # Configuration base de données
├── database/
│   └── schema.sql         # Schéma complet de la base
├── deploy/
│   ├── docker-compose.yml # Déploiement Docker
│   └── setup.sh          # Script d'installation serveur
├── package.json          # Dépendances Node.js
├── Dockerfile           # Container backend
└── .env.example        # Variables d'environnement

src/app/services/
└── api.service.ts      # Service Angular pour API
```

## Installation Locale

1. **Base de données**:
```bash
cd backend
mysql -u root -p < database/schema.sql
```

2. **Backend**:
```bash
cd backend
npm install
cp .env.example .env
# Modifier .env avec vos paramètres
npm start
```

3. **Frontend**:
```bash
ng serve
```

## Déploiement Production

### Option 1: Docker
```bash
cd backend/deploy
docker-compose up -d
```

### Option 2: Serveur Linux
```bash
cd backend/deploy
chmod +x setup.sh
sudo ./setup.sh
```

## Configuration Nginx (Production)

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    # Frontend Angular
    location / {
        root /var/www/cp2i-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Variables d'Environnement Production

```env
DB_HOST=localhost
DB_USER=cp2i_user
DB_PASSWORD=mot_de_passe_securise
DB_NAME=cp2i_db
JWT_SECRET=cle_jwt_production_securisee
PORT=3000
```

## API Endpoints Disponibles

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/textes` - Liste des textes
- `POST /api/textes` - Soumettre un texte
- `POST /api/corrections` - Corriger un texte
- `GET /api/messages` - Messages reçus
- `POST /api/messages` - Envoyer message
- `GET /api/stats` - Statistiques (admin)

## Sécurité

- Mots de passe hashés avec bcrypt
- Authentification JWT
- Validation des données
- Protection CORS
- Sessions sécurisées

Le système est maintenant prêt pour la mise en production avec toutes les fonctionnalités dynamiques.