# Intégration CP2i - Backend Dynamique

## 🎯 Objectif
Transformation du système CP2i statique en système dynamique avec backend PHP et base de données MySQL.

## 📁 Structure des fichiers créés

### Backend PHP (`src/app/back-end/`)
```
├── cp2i-auth.php          # Authentification (inscription/connexion)
├── cp2i-textes.php        # Gestion des textes soumis
├── cp2i-dashboard.php     # API pour les dashboards
├── cp2i-database.sql      # Schéma de base de données
├── test-api.php           # Tests de l'API
├── deploy.sh              # Script de déploiement
└── README.md              # Documentation backend
```

### Frontend Angular
```
├── services/cp2i-api.service.ts    # Service API Angular
├── guards/auth.guard.ts            # Protection des routes
├── environments/                   # Configuration environnement
│   ├── environment.ts
│   └── environment.prod.ts
```

## 🔧 Installation et Configuration

### 1. Base de données
```bash
# Exécuter le script SQL
mysql -u root -p < src/app/back-end/cp2i-database.sql
```

### 2. Configuration PHP
Modifier `src/app/back-end/config.php` :
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'u122559880_cp2i_db');
define('DB_USER', 'votre_utilisateur');
define('DB_PASS', 'votre_mot_de_passe');
```

### 3. Déploiement automatique
```bash
cd src/app/back-end/
chmod +x deploy.sh
./deploy.sh
```

## 🌐 Endpoints API

### Authentification
- **POST** `/cp2i-auth.php?action=register`
  ```json
  {
    "email": "user@example.com",
    "password": "motdepasse",
    "nom": "Nom",
    "prenom": "Prénom",
    "telephone": "123456789",
    "role": "participant"
  }
  ```

- **POST** `/cp2i-auth.php?action=login`
  ```json
  {
    "email": "user@example.com",
    "password": "motdepasse"
  }
  ```

### Gestion des textes
- **POST** `/cp2i-textes.php` - Soumettre un texte
- **GET** `/cp2i-textes.php` - Récupérer les textes
- **PUT** `/cp2i-textes.php` - Mettre à jour le statut

### Dashboard
- **GET** `/cp2i-dashboard.php?action=stats` - Statistiques
- **GET** `/cp2i-dashboard.php?action=profile` - Profil utilisateur

## 🔐 Sécurité

### Authentification JWT
- Tokens avec expiration (24h)
- Vérification automatique des permissions
- Protection contre les attaques CSRF

### Protection des données
- Hachage des mots de passe (bcrypt)
- Validation des entrées
- Protection contre l'injection SQL (PDO)

### CORS
- Configuration pour `https://penccumndongo.com`
- Headers de sécurité appropriés

## 📊 Base de données

### Tables principales

#### `cp2i_users`
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- email (VARCHAR(255), UNIQUE)
- password (VARCHAR(255))
- nom, prenom (VARCHAR(100))
- telephone (VARCHAR(20))
- role (ENUM: participant, corrector, admin)
- created_at, updated_at (TIMESTAMP)
```

#### `cp2i_textes`
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- user_id (INT, FOREIGN KEY)
- titre (VARCHAR(255))
- contenu (TEXT)
- langue (ENUM: francais, wolof, arabe)
- nb_vers (INT)
- statut (ENUM: en_attente, accepte, refuse)
- note (DECIMAL(4,2))
- commentaire (TEXT)
- created_at, updated_at (TIMESTAMP)
```

## 🎨 Frontend Angular

### Service API
Le service `Cp2iApiService` gère :
- Authentification avec stockage local des tokens
- Appels API sécurisés avec headers Authorization
- Gestion des erreurs et des réponses

### Composants mis à jour
- **CP2i Component** : Modales d'authentification intégrées
- **Dashboard Participant** : Données dynamiques depuis l'API
- **Soumission Texte** : Validation et envoi vers l'API

### Protection des routes
- `AuthGuard` protège les routes authentifiées
- Redirection automatique vers `/cp2i` si non connecté

## 🧪 Tests

### Test automatique de l'API
Accéder à : `https://penccumndongo.com/src/app/back-end/test-api.php`

Tests inclus :
- ✅ Connexion base de données
- ✅ Vérification des tables
- ✅ Test d'inscription
- ✅ Test de connexion
- ✅ Test de soumission de texte

### Tests manuels
1. **Inscription** : Créer un compte participant/correcteur
2. **Connexion** : Se connecter avec les identifiants
3. **Soumission** : Soumettre un texte (participants)
4. **Évaluation** : Évaluer les textes (correcteurs)
5. **Dashboard** : Vérifier les statistiques

## 🚀 Déploiement en production

### Prérequis serveur
- PHP 7.4+ avec extensions PDO, MySQL
- MySQL 5.7+ ou MariaDB 10.2+
- Serveur web (Apache/Nginx) avec HTTPS

### Configuration production
1. Modifier `environment.prod.ts` avec l'URL de production
2. Configurer les variables de base de données
3. Activer HTTPS et certificats SSL
4. Configurer les sauvegardes automatiques

### Monitoring
- Logs d'erreurs PHP
- Monitoring des performances API
- Sauvegarde quotidienne de la base de données

## 📈 Fonctionnalités dynamiques

### Pour les participants
- ✅ Inscription/Connexion sécurisée
- ✅ Soumission de textes avec validation
- ✅ Suivi du statut des soumissions
- ✅ Dashboard personnalisé avec statistiques
- ✅ Historique des textes soumis

### Pour les correcteurs
- ✅ Accès aux textes à évaluer
- ✅ Système de notation et commentaires
- ✅ Dashboard avec statistiques globales
- ✅ Gestion des évaluations

### Pour les administrateurs
- ✅ Vue d'ensemble complète
- ✅ Gestion des utilisateurs
- ✅ Statistiques détaillées
- ✅ Export des données

## 🔄 Prochaines étapes

1. **Notifications** : Système d'emails automatiques
2. **Export PDF** : Génération de rapports
3. **API REST complète** : Documentation Swagger
4. **Interface admin** : Panel d'administration avancé
5. **Analytics** : Tableaux de bord détaillés

## 📞 Support

Pour toute question ou problème :
- 📧 Email : pencc.penccumndongo@gmail.com
- 🌐 Site : https://penccumndongo.com
- 📱 Téléphone : +221 XX XXX XX XX