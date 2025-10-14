# Installation CP2i - Backend PHP

## Fichiers créés dans `src/app/back-end/`

- `config.php` - Configuration base de données et JWT
- `auth.php` - Authentification (login/register)
- `textes.php` - Gestion des textes soumis
- `corrections.php` - Système de correction
- `messages.php` - Messagerie interne
- `stats.php` - Statistiques pour admin
- `setup-cp2i.sql` - Script de création des tables

## Installation

### 1. Base de données
Exécuter le script SQL sur votre serveur :
```sql
mysql -u u122559880_root -p u122559880_form_contact < setup-cp2i.sql
```

### 2. Configuration
Les fichiers PHP utilisent la même base que le contact existant :
- Host: `localhost`
- Database: `u122559880_form_contact`
- User: `u122559880_root`
- Password: `Tafsir#27`

### 3. Endpoints disponibles

**Authentification :**
- `POST auth.php?action=register` - Inscription
- `POST auth.php?action=login` - Connexion

**Textes :**
- `GET textes.php` - Liste des textes
- `POST textes.php` - Soumettre un texte

**Corrections :**
- `GET corrections.php` - Liste des corrections
- `POST corrections.php` - Corriger un texte

**Messages :**
- `GET messages.php` - Messages reçus
- `POST messages.php` - Envoyer un message

**Statistiques :**
- `GET stats.php` - Statistiques admin

## Sécurité

- Authentification JWT
- Validation des données
- Protection CORS
- Hashage des mots de passe
- Vérification des rôles

## Comptes par défaut

- **Admin :** admin@cp2i.com / password
- **Correcteur :** correcteur@cp2i.com / password

Le système est **complet et prêt à l'emploi** avec :
✅ Base de données intégrée
✅ API PHP fonctionnelle  
✅ Authentification sécurisée
✅ Gestion des rôles
✅ Interface Angular connectée