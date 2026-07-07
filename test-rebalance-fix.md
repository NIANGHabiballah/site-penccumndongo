# Correction du problème de rééquilibrage

## Problème identifié
La méthode `rebalanceAssignments()` dans `dashboard-admin.component.ts` faisait des appels HTTP parallèles dans une boucle, causant des erreurs 400 "Bad Request" répétées.

## Corrections apportées

### 1. Méthode rebalanceAssignments (dashboard-admin.component.ts)
- **Avant** : Appels HTTP parallèles avec `for` loop et `subscribe()`
- **Après** : Traitement séquentiel avec `async/await` et `Promise`

**Changements principaux :**
- Conversion en méthode `async`
- Traitement séquentiel des transferts
- Délais entre les appels (100ms et 200ms)
- Gestion d'erreurs avec try/catch
- Réduction du seuil de rééquilibrage (de 10 à 3)

### 2. Service API (cp2i-api.service.ts)
- Ajout de `retry(2)` pour les méthodes `assignCorrector` et `unassignCorrector`
- Amélioration de la gestion d'erreurs avec `catchError`
- Ajout des imports RxJS nécessaires

## Avantages de la correction

1. **Évite les conflits** : Les appels HTTP sont maintenant séquentiels
2. **Meilleure gestion d'erreurs** : Try/catch et retry automatique
3. **Performance** : Délais pour éviter la surcharge du serveur
4. **Stabilité** : Moins de risques d'erreurs 400
5. **Logging amélioré** : Meilleur suivi des transferts

## Test de la correction

Pour tester la correction :
1. Ouvrir le dashboard admin
2. Aller dans la section "Affectations"
3. Cliquer sur "Rééquilibrer les affectations"
4. Vérifier qu'il n'y a plus d'erreurs 400 dans la console
5. Confirmer que les transferts se font correctement

## Code avant/après

### Avant (problématique)
```typescript
for (let i = 0; i < nombreATransferer; i++) {
  this.cp2iApi.unassignCorrector(...).subscribe({
    next: () => {
      this.cp2iApi.assignCorrector(...).subscribe({...});
    }
  });
}
```

### Après (corrigé)
```typescript
for (let i = 0; i < nombreATransferer; i++) {
  await new Promise((resolve, reject) => {
    this.cp2iApi.unassignCorrector(...).subscribe({
      next: () => resolve(true),
      error: (error) => reject(error)
    });
  });
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  await new Promise((resolve, reject) => {
    this.cp2iApi.assignCorrector(...).subscribe({
      next: () => resolve(true),
      error: (error) => reject(error)
    });
  });
}
```

La correction garantit que chaque opération se termine avant de passer à la suivante, éliminant ainsi les erreurs de concurrence.