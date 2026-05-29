# Comment vérifier le Module Planning

Le module Planning est responsable de la génération des tâches de médication (calendrier) et de la gestion de leur statut (ex: marquer comme manqué). Comme il fonctionne principalement en arrière-plan via des tâches Cron et des Événements, voici comment vérifier son bon fonctionnement.

## 1. Génération Automatique de Tâches (Événementiel)
Lorsqu'une nouvelle médication est créée, le système doit générer immédiatement les tâches pour les prochaines 24 heures.

### Étapes de vérification :
1. **Créer une Médication** : Utilisez l'API (via Swagger UI ou Postman) pour faire un `POST /medications`.
    - S'assurer que `startDate` est fixé à aujourd'hui.
    - Définissez une fréquence (`frequency`, ex: `DAILY` avec des heures comme `["08:00", "20:00"]`).
2. **Vérifier les Logs** : Regardez le terminal du backend. On devrais voir :
   ```text
   Received medication.created event for ID. Generating tasks...
   Immediate tasks generated for ID.
   ```
3. **Vérifier dans la Base de Données** : Consultez la collection `medicationtasks` dans MongoDB.
   - On devrais voir de nouveaux documents avec le statut `status: "PENDING"` et des heures `scheduledAt` correspondant à votre fréquence.

## 2. Génération par Lot Horaire (Job Cron)
Le système exécute une tâche de fond toutes les heures pour s'assurer que les tâches sont générées pour les prochaines 24 heures (comblant les éventuels manques).

### Étapes de vérification :
1. **Observer les Logs** : Le backend journalisera ce message toutes les heures à la minute 0 :
   ```text
   Starting generation for the next 24 hours...
   ```
2. **Déclenchement Manuel (Pour Test)** : Si on ne veut pas attendre une heure, on peut modifier temporairement l'expression cron dans `PlanningCron.ts` en `*/1 * * * *` (chaque minute) pour la voir s'exécuter.

## 3. Marquage Automatique des Tâches Manquées par le Cron
Toutes les 30 minutes, le système vérifie les tâches `PENDING` qui étaient prévues il y a plus de 2 heures et les marque comme `MISSED`.

### Étapes de vérification :
1. **Préparer les Données de Test** :
   - Modifiez manuellement une `MedicationTask` dans MongoDB.
   - Fixez `scheduledAt` à une heure située 3 heures dans le passé.
   - Fixez `status` à `"PENDING"`.
2. **Attendre/Déclencher le Job** : Attendez 30 minutes ou observez les logs :
   ```text
   Checking for PENDING tasks scheduled before <Timestamp>
   Marking 1 tasks as MISSED.
   ```
3. **Vérifier le Statut** : Vérifiez le document dans MongoDB. Le statut `status` doit maintenant être `"MISSED"`.

## 4. Validation Logique (Tests Unitaires)
La logique métier réside dans `TaskGeneratorService.ts`. On peut vérifier les fréquences complexes (comme `WEEKLY` sur des jours spécifiques) en observant le nombre de tâches générées pour une fenêtre donnée.

- **Test Hebdomadaire** : Si une médication est prévue pour `["MONDAY"]` mais que la fenêtre est un mardi, 0 tâche doit être générée.
- **Test de Fenêtre** : Si la fenêtre ne fait que 1 heure de large, seules les tâches tombant dans cette heure précise doivent être générées.
