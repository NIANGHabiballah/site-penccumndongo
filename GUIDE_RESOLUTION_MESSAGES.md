# Guide de Résolution des Problèmes de Messages CP2i

## Problème : Les destinataires ne reçoivent pas les messages

### Étapes de diagnostic

#### 1. Vérifier les scripts de diagnostic
Accédez aux scripts suivants dans votre navigateur :
- `https://penccumndongo.com/debug-messages.php` - Diagnostic complet
- `https://penccumndongo.com/test-messages.php` - Test des messages
- `https://penccumndongo.com/test-send-message.php` - Test d'envoi

#### 2. Vérifier la structure de la base de données
Assurez-vous que les tables suivantes existent :
```sql
-- Table des messages
CREATE TABLE cp2i_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    send_to_all TINYINT(1) DEFAULT 0,
    images TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES cp2i_users(id)
);

-- Table des destinataires
CREATE TABLE cp2i_message_recipients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    recipient_id INT NOT NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES cp2i_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES cp2i_users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_message_recipient (message_id, recipient_id)
);
```

#### 3. Vérifier les logs
Consultez les logs PHP pour voir les erreurs :
- Logs d'envoi de messages
- Logs de récupération de messages
- Erreurs de base de données

### Solutions appliquées

#### 1. Correction de la méthode sendMessage (Backend)
- ✅ Ajout de logs détaillés pour tracer l'envoi
- ✅ Amélioration de la gestion des transactions
- ✅ Vérification de l'existence des destinataires
- ✅ Validation finale du nombre de destinataires ajoutés

#### 2. Correction de la méthode getMessages (Backend)
- ✅ Meilleure gestion des messages collectifs et individuels
- ✅ Création automatique des entrées manquantes pour les messages collectifs
- ✅ Logs détaillés pour le débogage

#### 3. Correction du frontend (Dashboard Admin)
- ✅ Utilisation du service CP2i API au lieu d'appels HTTP directs
- ✅ Amélioration des notifications avec détails sur le succès/échec
- ✅ Logs de débogage pour tracer les problèmes

### Tests à effectuer

#### 1. Test d'envoi de message collectif
1. Connectez-vous en tant qu'admin
2. Allez dans Messages > Nouveau message
3. Sélectionnez "Envoyer à tous les utilisateurs"
4. Envoyez un message de test
5. Vérifiez que tous les utilisateurs le reçoivent

#### 2. Test d'envoi de message individuel
1. Connectez-vous en tant qu'admin
2. Allez dans Messages > Nouveau message
3. Sélectionnez "Sélectionner des destinataires"
4. Choisissez 2-3 utilisateurs spécifiques
5. Envoyez un message de test
6. Vérifiez que seuls les utilisateurs sélectionnés le reçoivent

#### 3. Test de réception côté participant
1. Connectez-vous en tant que participant
2. Allez dans la section Messages
3. Vérifiez que les messages apparaissent
4. Testez le marquage comme lu

### Commandes SQL utiles pour le débogage

#### Vérifier les messages récents
```sql
SELECT m.id, m.subject, m.send_to_all, m.created_at,
       COUNT(mr.id) as recipient_count
FROM cp2i_messages m
LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id
GROUP BY m.id
ORDER BY m.created_at DESC
LIMIT 10;
```

#### Vérifier les destinataires d'un message spécifique
```sql
SELECT mr.recipient_id, u.prenom, u.nom, u.email, mr.read_at
FROM cp2i_message_recipients mr
JOIN cp2i_users u ON mr.recipient_id = u.id
WHERE mr.message_id = [ID_DU_MESSAGE]
ORDER BY u.prenom, u.nom;
```

#### Vérifier les messages reçus par un utilisateur
```sql
SELECT m.id, m.subject, m.created_at, mr.read_at
FROM cp2i_messages m
LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id
WHERE mr.recipient_id = [ID_UTILISATEUR]
ORDER BY m.created_at DESC;
```

#### Trouver les messages orphelins (sans destinataires)
```sql
SELECT m.id, m.subject, m.send_to_all, m.created_at
FROM cp2i_messages m
LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id
WHERE mr.message_id IS NULL AND m.send_to_all = 0;
```

### Problèmes courants et solutions

#### 1. Messages collectifs non reçus
**Cause** : Entrées manquantes dans `cp2i_message_recipients`
**Solution** : Le système crée maintenant automatiquement les entrées manquantes

#### 2. Messages individuels non reçus
**Cause** : Destinataires non ajoutés lors de l'envoi
**Solution** : Validation améliorée avec transactions et logs détaillés

#### 3. Erreurs CORS
**Cause** : Appels HTTP directs au lieu du service API
**Solution** : Utilisation du service CP2i API pour tous les appels

#### 4. Notifications incorrectes
**Cause** : Messages d'erreur génériques
**Solution** : Notifications détaillées avec informations spécifiques

### Maintenance préventive

#### 1. Nettoyage périodique
```sql
-- Supprimer les messages très anciens (plus de 6 mois)
DELETE FROM cp2i_messages 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);
```

#### 2. Vérification de l'intégrité
```sql
-- Vérifier les messages sans destinataires
SELECT COUNT(*) as orphan_messages
FROM cp2i_messages m
LEFT JOIN cp2i_message_recipients mr ON m.id = mr.message_id
WHERE mr.message_id IS NULL AND m.send_to_all = 0;
```

#### 3. Statistiques de performance
```sql
-- Messages par mois
SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
FROM cp2i_messages
GROUP BY month
ORDER BY month DESC;
```

### Contact et support

Si les problèmes persistent après avoir suivi ce guide :
1. Consultez les logs détaillés
2. Exécutez les scripts de diagnostic
3. Vérifiez la structure de la base de données
4. Testez avec les commandes SQL fournies

Les corrections apportées incluent :
- Logs détaillés pour tracer les problèmes
- Gestion améliorée des transactions
- Validation des destinataires
- Notifications détaillées
- Scripts de diagnostic complets