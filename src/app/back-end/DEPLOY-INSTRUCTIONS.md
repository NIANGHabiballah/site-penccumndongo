# 🚀 INSTRUCTIONS DE DÉPLOIEMENT CP2i

## 📋 Prérequis
- Accès MySQL au serveur
- Base de données : `u122559880_cp2i_db`
- Utilisateur : `u122559880_root`
- Mot de passe : `Tafsir#27`

## 🗄️ Création des tables

### Option 1 : Via phpMyAdmin
1. Connectez-vous à phpMyAdmin
2. Sélectionnez la base `u122559880_cp2i_db`
3. Copiez-collez le contenu de `DEPLOY-SQL.sql`
4. Exécutez les requêtes

### Option 2 : Via ligne de commande
```bash
mysql -u u122559880_root -p u122559880_cp2i_db < DEPLOY-SQL.sql
```

## ✅ Vérification

### Tables créées :
- ✅ `cp2i_users` - Utilisateurs avec validation email
- ✅ `cp2i_textes` - Textes soumis
- ✅ `cp2i_corrections` - Corrections des textes

### Comptes de test créés :
- **Admin** : `admin@cp2i.com` / `password123`
- **Correcteur** : `correcteur@cp2i.com` / `password123`  
- **Participant** : `participant@cp2i.com` / `password123`

## 🔧 Configuration serveur

### Fichiers à vérifier :
- ✅ `config.php` - Configuration BDD correcte
- ✅ `cp2i-auth.php` - Authentification
- ✅ `cp2i-textes.php` - Gestion textes
- ✅ `cp2i-dashboard.php` - Statistiques
- ✅ `cp2i-verify.php` - Validation email

### URLs de test :
- **API Auth** : `https://penccumndongo.com/src/app/back-end/cp2i-auth.php`
- **Test API** : `https://penccumndongo.com/src/app/back-end/test-api.php`
- **Vérification** : `https://penccumndongo.com/src/app/back-end/cp2i-verify.php`

## 📧 Configuration email

### Paramètres SMTP (si nécessaire) :
```php
// Dans cp2i-auth.php, fonction sendVerificationEmail()
// Remplacer mail() par PHPMailer si besoin
```

## 🧪 Tests

1. **Test connexion BDD** : Accéder à `test-api.php`
2. **Test inscription** : Créer un compte via l'interface
3. **Test email** : Vérifier réception email de validation
4. **Test connexion** : Se connecter avec compte validé

## 🔒 Sécurité

- ✅ Mots de passe hachés (bcrypt)
- ✅ Protection injection SQL (PDO)
- ✅ Validation email obligatoire
- ✅ Tokens JWT sécurisés
- ✅ CORS configuré

## 📞 Support

En cas de problème :
1. Vérifier les logs d'erreur PHP
2. Tester la connexion BDD
3. Vérifier les permissions fichiers
4. Contrôler la configuration CORS