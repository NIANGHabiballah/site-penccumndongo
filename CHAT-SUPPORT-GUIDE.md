# Guide du Système de Chat Support CP2i

## Vue d'ensemble

Le système de chat support permet aux participants de communiquer directement avec les administrateurs pour obtenir de l'aide. Il comprend :

- **Widget de chat flottant** pour les participants
- **Interface complète de chat** pour les participants
- **Interface d'administration** pour gérer les conversations
- **Système de notifications** en temps réel
- **Réponses rapides** pour les administrateurs

## Installation et Configuration

### 1. Base de données

Exécutez le script SQL pour créer les tables nécessaires :

```bash
mysql -u username -p database_name < backend/database/chat-support-schema.sql
```

### 2. Configuration du proxy

Le fichier `proxy.conf.json` est déjà configuré pour rediriger les appels API.

### 3. Intégration dans l'application

#### Pour les participants :

Ajoutez le widget de chat dans votre composant principal :

```typescript
// app.component.ts
import { ChatWidgetComponent } from './components/chat-widget/chat-widget.component';

@Component({
  imports: [ChatWidgetComponent],
  template: `
    <router-outlet></router-outlet>
    <app-chat-widget></app-chat-widget>
  `
})
```

#### Pour l'interface complète :

Ajoutez la route dans `app.routes.ts` :

```typescript
{
  path: 'chat-support',
  component: ChatSupportComponent,
  canActivate: [AuthGuard]
}
```

#### Pour l'administration :

Ajoutez la route admin dans `app.routes.ts` :

```typescript
{
  path: 'admin/chat',
  component: AdminChatComponent,
  canActivate: [AdminGuard]
}
```

## Fonctionnalités

### Pour les Participants

#### Widget de Chat Flottant
- **Position** : Coin inférieur droit de l'écran
- **Notification** : Badge rouge avec le nombre de messages non lus
- **Connexion requise** : L'utilisateur doit être connecté pour utiliser le chat

#### Interface Complète de Chat
- **Conversations multiples** : Gestion de plusieurs conversations
- **Historique complet** : Accès à tous les messages
- **Statuts visuels** : Indication du statut de chaque conversation

### Pour les Administrateurs

#### Gestion des Conversations
- **Vue d'ensemble** : Liste de toutes les conversations
- **Assignation** : Possibilité de s'assigner une conversation
- **Priorités** : Système de priorités (Faible, Moyenne, Haute)
- **Statuts** : Ouvert, Assigné, Fermé

#### Réponses Rapides
- **Templates prédéfinis** : Réponses courantes pré-écrites
- **Catégories** : Organisation par type (Général, Inscription, Technique, etc.)
- **Gestion** : Ajout, modification, suppression des réponses

#### Statistiques
- **Métriques globales** : Nombre total de conversations
- **Performance** : Temps de réponse moyen
- **Taux de résolution** : Pourcentage de conversations fermées

## API Endpoints

### Conversations
- `GET /chat-support.php?action=conversations` - Liste des conversations
- `POST /chat-support.php?action=create` - Créer une conversation
- `POST /chat-support.php?action=assign` - Assigner une conversation
- `POST /chat-support.php?action=close` - Fermer une conversation
- `POST /chat-support.php?action=priority` - Changer la priorité

### Messages
- `GET /chat-support.php?action=messages&conversation_id=X` - Messages d'une conversation
- `POST /chat-support.php?action=send` - Envoyer un message
- `POST /chat-support.php?action=mark_read` - Marquer comme lu

### Statistiques
- `GET /chat-support.php?action=stats` - Statistiques du support
- `GET /chat-support.php?action=unread_count` - Nombre de messages non lus

## Structure des Données

### Conversation
```typescript
interface ChatConversation {
  id: number;
  participant_id: number;
  admin_id?: number;
  subject: string;
  status: 'open' | 'assigned' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  unread_count: number;
}
```

### Message
```typescript
interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_type: 'participant' | 'admin';
  message: string;
  timestamp: string;
  read: boolean;
}
```

## Personnalisation

### Styles
Les fichiers CSS peuvent être modifiés pour adapter l'apparence :
- `chat-widget.component.ts` (styles inline)
- `chat-support.component.css`
- `admin-chat.component.css`

### Réponses Rapides
Modifiez les réponses par défaut dans le fichier SQL ou via l'interface d'administration.

### Notifications
Le système vérifie les nouveaux messages toutes les 5 secondes. Modifiez l'intervalle dans `chat-support.service.ts` :

```typescript
interval(5000) // 5 secondes
```

## Sécurité

- **Authentification** : Vérification du token JWT pour tous les appels API
- **Autorisation** : Contrôle d'accès basé sur les rôles
- **Validation** : Validation des données côté serveur
- **Échappement** : Protection contre les injections XSS

## Déploiement

1. **Fichiers à déployer** :
   - `src/app/services/chat-support.service.ts`
   - `src/app/pages/chat-support/`
   - `src/app/pages/admin-chat/`
   - `src/app/components/chat-widget/`
   - `src/app/back-end/chat-support.php`

2. **Base de données** :
   - Exécuter le script `chat-support-schema.sql`

3. **Configuration** :
   - Vérifier les URLs dans les services
   - Configurer les permissions utilisateurs

## Support et Maintenance

### Logs
Les erreurs sont loggées dans la console du navigateur. Pour un environnement de production, implémentez un système de logging côté serveur.

### Performance
- **Pagination** : Implémentez la pagination pour les conversations nombreuses
- **Cache** : Utilisez un cache Redis pour les sessions actives
- **WebSockets** : Pour des notifications en temps réel plus efficaces

### Monitoring
Surveillez les métriques suivantes :
- Nombre de conversations actives
- Temps de réponse moyen
- Taux de satisfaction des utilisateurs

## Évolutions Futures

- **Notifications push** : Intégration avec un service de notifications
- **Fichiers joints** : Possibilité d'envoyer des images/documents
- **Chatbot IA** : Réponses automatiques intelligentes
- **Intégration email** : Notifications par email
- **Application mobile** : Version mobile dédiée