# Backend CP2i - API PHP

## Description
API PHP pour le système CP2i (Concours de Poésie Inédit & Innovant) de Penccum Ndongo.

## Structure des fichiers

### Fichiers principaux
- `config.php` - Configuration de la base de données et fonctions utilitaires
- `cp2i-auth.php` - Authentification (inscription/connexion)
- `cp2i-textes.php` - Gestion des textes soumis
- `cp2i-dashboard.php` - Données pour les dashboards
- `cp2i-database.sql` - Schéma de la base de données

### Installation

1. **Base de données**
   ```bash
   mysql -u root -p < cp2i-database.sql
   ```

2. **Configuration**
   Modifiez `config.php` avec vos paramètres de base de données :
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'u122559880_cp2i_db');
   define('DB_USER', 'votre_utilisateur');
   define('DB_PASS', 'votre_mot_de_passe');
   ```

3. **Déploiement automatique**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Endpoints API

### Authentification
- `POST /cp2i-auth.php?action=register` - Inscription
- `POST /cp2i-auth.php?action=login` - Connexion

### Textes
- `POST /cp2i-textes.php` - Soumettre un texte
- `GET /cp2i-textes.php` - Récupérer les textes (selon le rôle)
- `PUT /cp2i-textes.php` - Mettre à jour le statut d'un texte (correcteurs)

### Dashboard
- `GET /cp2i-dashboard.php?action=stats` - Statistiques
- `GET /cp2i-dashboard.php?action=profile` - Profil utilisateur

## Sécurité

- Authentification JWT
- Protection CORS
- Validation des données
- Hachage des mots de passe
- Protection contre l'injection SQL

## Base de données

### Tables principales
- `cp2i_users` - Utilisateurs (participants, correcteurs, admin)
- `cp2i_textes` - Textes soumis
- `cp2i_corrections` - Corrections et évaluations

### Rôles utilisateur
- `participant` - Peut soumettre des textes
- `corrector` - Peut évaluer les textes
- `admin` - Accès complet

## Utilisation avec Angular

Le service `Cp2iApiService` dans Angular communique avec cette API :

```typescript
// Exemple d'utilisation
this.cp2iApi.login(credentials).subscribe(response => {
  // Traiter la réponse
});
```

## Maintenance

- Logs d'erreurs dans les logs du serveur web
- Sauvegarde régulière de la base de données
- Mise à jour des dépendances PHP si nécessaire