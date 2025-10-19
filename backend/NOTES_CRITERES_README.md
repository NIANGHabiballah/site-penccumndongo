# Mise à jour du système d'évaluation par critères

## Modifications apportées

### 1. Structure de la base de données

Ajout de 4 nouvelles colonnes dans la table `corrections` :
- `note_pertinence` (DECIMAL 3,1) - Note Pertinence sur 5
- `note_coherence` (DECIMAL 3,1) - Note Cohérence sur 5  
- `note_correction` (DECIMAL 3,1) - Note Correction de la langue sur 5
- `note_presentation` (DECIMAL 3,1) - Note Présentation sur 5

### 2. Scripts créés

- `setup-criteres-evaluation.php` - Script principal de mise à jour
- `update-corrections-structure.php` - Mise à jour de la structure
- `insert-test-correction.php` - Insertion de données de test
- `get-evaluation-details.php` - API pour récupérer les évaluations détaillées
- `test-evaluation-api.php` - Test de l'API

### 3. Fonctionnalités

#### Affichage des notes par critère
L'interface participant affiche maintenant :
```
À mademoiselle Louise B.
Admis (≥10/20)
Correcteur
12.00/20
Pertinence: 3.0/5
Cohérence: 3.0/5
Correction de la langue: 3.0/5
Présentation: 3.0/5
```

#### API d'évaluation détaillée
- Endpoint: `get-evaluation-details.php?texte_id=X`
- Retourne les corrections avec notes par critère
- Fallback automatique si pas de notes détaillées

### 4. Installation

1. Exécuter le script de mise à jour :
```bash
php backend/setup-criteres-evaluation.php
```

2. Tester l'API :
```bash
php backend/test-evaluation-api.php
```

### 5. Utilisation dans Angular

Le service `Cp2iApiService` utilise la méthode :
```typescript
getTextCorrections(texteId: number): Observable<any>
```

Le composant charge automatiquement les évaluations détaillées dans `loadEvaluationsDetaillees()`.

### 6. Grille d'évaluation CP2i

Selon la grille fournie :
- **Pertinence** (5 points) : Idée générale, ordre des idées, transitions
- **Cohérence** (5 points) : Connecteurs, unité du thème, cohérence des idées  
- **Correction de la langue** (5 points) : Syntaxe, orthographe, accords, vocabulaire
- **Présentation** (5 points) : Structure, rythme, sons, figures de style

**Total : 20 points**