# MISE À JOUR BASE DE DONNÉES REQUISE

## Problème actuel
Les images ne s'affichent pas côté admin car la colonne `images` n'existe pas dans la table `chat_messages`.

## Solution
Exécutez cette requête SQL dans votre base de données :

```sql
ALTER TABLE chat_messages ADD COLUMN images TEXT NULL;
```

## Vérification
Après avoir exécuté la requête, les images devraient s'afficher correctement des deux côtés (participant et admin).

## Structure finale attendue
```sql
CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    sender_type ENUM('participant', 'admin') NOT NULL,
    message TEXT NOT NULL,
    images TEXT NULL,  -- ← Cette colonne doit exister
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_status TINYINT(1) DEFAULT 0
);
```