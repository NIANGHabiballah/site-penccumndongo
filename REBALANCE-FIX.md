# Fix pour le problème de rééquilibrage des affectations

## Problème identifié

La fonction `rebalanceAssignments()` dans `dashboard-admin.component.ts` générait des erreurs HTTP 400 répétées lors du rééquilibrage des affectations de correcteurs.

### Symptômes observés :
- Erreurs 400 répétées dans la console
- Appels HTTP en boucle vers `cp2i-dashboard.php?action=assign_corrector`
- Fonction bloquée sans message d'erreur clair

## Causes du problème

1. **Gestion d'erreur insuffisante** : Pas de timeout sur les appels HTTP
2. **Validation faible** : Données non validées côté backend
3. **Pas de limitation de débit** : Appels trop rapides surchargeant le serveur
4. **Logging insuffisant** : Difficile de diagnostiquer les erreurs

## Solutions implémentées

### 1. Frontend (`dashboard-admin.component.ts`)

#### Améliorations apportées :
- **Validation préliminaire** : Vérification du nombre de correcteurs
- **Timeouts** : Limitation à 10 secondes par appel HTTP
- **Gestion d'erreur robuste** : Compteur d'erreurs avec arrêt automatique
- **Délais entre appels** : 500ms entre désassignation/réassignation, 1s entre transferts
- **Logging détaillé** : Suivi précis de chaque étape

#### Code clé ajouté :
```typescript
// Timeout sur les appels HTTP
await Promise.race([
  new Promise((resolve, reject) => {
    this.cp2iApi.unassignCorrector(texteId, correcteurId).subscribe({
      next: (response) => resolve(true),
      error: (error) => reject(error)
    });
  }),
  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
]);

// Délais pour éviter la surcharge
await new Promise(resolve => setTimeout(resolve, 500));
```

### 2. Backend (`cp2i-dashboard.php`)

#### Améliorations apportées :
- **Validation stricte** : Vérification que les IDs sont numériques
- **Vérifications d'existence** : Contrôle que texte et correcteur existent
- **Vérification des rôles** : S'assurer que l'utilisateur est bien correcteur
- **Logging détaillé** : Enregistrement de toutes les opérations et erreurs

#### Code clé ajouté :
```php
// Validation stricte des IDs
if (!$texte_id || !$corrector_id || !is_numeric($texte_id) || !is_numeric($corrector_id)) {
    error_log('assignCorrector - IDs invalides: texte_id=' . $texte_id . ', corrector_id=' . $corrector_id);
    http_response_code(400);
    echo json_encode(['error' => 'IDs texte et correcteur requis et doivent être numériques']);
    return;
}

// Vérification d'existence du correcteur et de son rôle
$stmt = $db->prepare("SELECT id, role FROM cp2i_users WHERE id = ?");
$stmt->execute([$corrector_id]);
$corrector = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$corrector || $corrector['role'] !== 'correcteur') {
    http_response_code(400);
    echo json_encode(['error' => 'Correcteur invalide']);
    return;
}
```

## Utilisation

### Pour tester le fix :
1. Aller dans le dashboard admin
2. Section "Affectations" > Vue "Par correcteur"
3. Cliquer sur "Rééquilibrer automatiquement"
4. Observer les logs dans la console pour le suivi

### Logs à surveiller :
- **Frontend** : Messages de progression dans la console
- **Backend** : Logs d'erreur dans les fichiers de log PHP
- **Réseau** : Réponses HTTP dans l'onglet Network des DevTools

## Prévention

### Bonnes pratiques ajoutées :
1. **Timeouts systématiques** sur tous les appels HTTP longs
2. **Validation côté client ET serveur**
3. **Limitation de débit** pour éviter la surcharge
4. **Logging détaillé** pour faciliter le débogage
5. **Gestion d'erreur gracieuse** avec messages utilisateur clairs

### Monitoring recommandé :
- Surveiller les logs d'erreur PHP
- Vérifier les performances des requêtes de base de données
- Monitorer la charge serveur pendant les opérations de masse

## Tests effectués

✅ Rééquilibrage avec 2 correcteurs et 10 textes  
✅ Gestion des erreurs de timeout  
✅ Validation des données invalides  
✅ Logging des opérations  
✅ Limitation du débit d'appels  

## Notes techniques

- La fonction est maintenant `async/await` pour une meilleure gestion des promesses
- Les erreurs 400 sont maintenant correctement gérées et loggées
- Le système s'arrête automatiquement après 3 erreurs consécutives
- Un délai de rechargement des données est ajouté pour éviter les conflits

## Maintenance future

Pour éviter ce type de problème :
1. Toujours ajouter des timeouts sur les appels HTTP
2. Valider les données côté client ET serveur
3. Implémenter un système de retry avec backoff exponentiel
4. Ajouter des métriques de performance pour détecter les problèmes tôt