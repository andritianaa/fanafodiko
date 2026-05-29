# Roadmap

## Phase 1 : Initialisation

* [x] **Initialisation du Monorepo avec Turborepo & Bun**
* [x] Configuration de turbo
* [x] Création de la structure des packages


* [x] **Création des applications (`/apps`)**
* [x] `apps/backend` : Initialisation de Hono.js avec Bun
* [x] `apps/frontend` : Initialisation de React (Vite + TS)


## Phase 2 : Fondations du Backend

* [x] **Architecture DDD**
* [x] Mise en place du dossier `src/core` (Erreurs , Events, services)
* [x] Configuration du middleware de gestion d'erreurs global (Hono)


* [x] **Base de données**
* [x] Configuration de la connexion Mongoose
* [x] Mise en place de l'injection de dépendances


* [x] **Sécurité de base**
* [x] Configuration de CORS et des headers de sécurité (Helmet/Hono security)
* [x] Setup de la doc automatique avec hono openapi

## Phase 3 : Module Identity & Access

* [x] **Modélisation du Domaine**
* [x] Implémenter l'entité `User`
* [x] Implémenter l'entité `Profile` (Gestion multi-utilisateurs/foyer)
* [x] Définir les interfaces de Repositories (`IUserRepository`, `IProfileRepository`, `ISessionRepository`)

* [x] **Couche Infrastructure**
* [x] Implémenter les schémas Mongoose
* [x] Développer les repositories

* [x] **Couche Application (Use Cases)**
* [x] `RegisterUser` (avec création automatique du profil par défaut)
* [x] `Login` (Génération JWT Access)
* [x] `Logout`
* [x] `AddProfile` / `ManageHousehold` (Gestion des personnes à charge)

* [x] **Couche Interface (API Routes)**
* [x] Contrôleurs Hono pour l'authentification
* [x] Middlewares d'autorisation


## Phase 4: Medication Management

* [x] **Modélisation du Domaine**
- [x] Définir le Value Object `Frequency` (Daily, Weekly, etc.)
- [x] Coder l'entité `Medication` (id, profileId, name, dosage, frequency, startDate)
- [x] Définir l'interface `IMedicationRepository`

* [x] **Couche Infrastructure**
- [x] Créer le schéma Mongoose `Medication`
- [x] Implémenter `MongooseMedicationRepository`

* [x] **Couche Application (Use Cases)**
- [x] Use Case `CreateMedication` (validation + enregistrement)
- [x] Use Case `ListMedicationsByProfile` (vérification ownership userId/profileId)
- [x] Use Case `UpdateMedication`
- [x] Use Case `DeleteMedication`

* [x] **Couche Interface (API Routes)**
- [x] Route `POST /medications`
- [x] Route `GET /medications?profileId=...`
- [x] Route `PATCH /medications/:id`
- [x] Route `DELETE /medications/:id`

## Phase 5 : Planning (Moteur Cron)

* [x] **Modélisation du Domaine**
- [x] Coder l'entité `MedicationTask` (id, medicationId, profileId, scheduledAt, status: 'PENDING')
- [x] Définir l'interface `ITaskRepository`

* [x] **Couche Infrastructure**
- [x] Créer le schéma Mongoose `MedicationTask`
- [x] Ajouter l'index unique `{ medicationId: 1, scheduledAt: 1 }` (idempotence)
- [x] Implémenter `MongooseTaskRepository`

* [x] **Couche Application (Use Cases)**
- [x] Service `TaskGenerator` (calcul des occurrences sur 24h selon Frequency)
- [x] Use Case `GenerateDailyTasks` (boucle sur médications actives + appel TaskGenerator)

* [x] Worker Cron
- [x] Installer `croner` ou équivalent
- [x] Configurer le scheduler dans `index.ts`
- [x] Lancer `GenerateDailyTasks` toutes les heures

## Phase 6 : Notification & Suivi

* [x] **Couche Application (Use Cases)**
- [x] Use Case `CheckAndSendNotifications` (recherche tasks PENDING avec scheduledAt <= now)
- [x] Use Case `MarkTaskAsTaken` (changement status 'TAKEN')

* [x] **Couche Infrastructure**
- [x] Créer le service `NotificationService` (console.log pour test, abstraction pour Email/Push)
- [x] Intégrer NotificationService dans le worker

* [x] **Couche Interface (API Routes)**
- [x] Route `PATCH /tasks/:id/take`
- [x] Route `GET /tasks?profileId=...&status=...` (optionnel, pour lister les tâches)

* [x] Worker Notification
- [x] Ajouter un job Cron qui exécute `CheckAndSendNotifications` (ex: toutes les 5 min)

## Phas7 : Frontend React

### Setup
- [x] Configurer le routing (React Router)
- [x] Initialisation shadCN
- [x] Configurer l'état global

### Intégration API
- [x] Service HTTP (fetch/axios) avec gestion du token JWT
- [x] Appels aux endpoints Identity
- [x] Appels aux endpoints Medications
- [x] Appels aux endpoints Tasks

### Pages & Composants
- [x] Page auth
- [x] Page Households (liste des profils)
- [x] Medications (CRUD par profil)
- [x] Page Planning
- [x] Page Tasks/Notifications (liste + action "Prendre")
- [x] Composant de notification (affichage alert/toast)
- [x] Page Dahboard
- [x] Page médicaments


## Tests & Finitions

- [x] Tests unitaires des Use Cases critiques
- [ ] Tests d'intégration des repositories
- [x] README avec instructions de démarrage

## Phase finale

* [x] Rédaction du `README.md` (Installation, Architecture, Choix techniques)
* [ ] Dockerisation du projet (`Dockerfile`)
