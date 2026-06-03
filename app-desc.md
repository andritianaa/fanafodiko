# Fanafodiko, Description complète de l'application

> *Fanafodiko* signifie **« mon médicament »** en malgache.

---

## 1. Qu'est-ce que Fanafodiko ?

Fanafodiko est une plateforme de santé familiale qui centralise la gestion des médicaments, la localisation des pharmacies et la recherche de disponibilité de médicaments en temps réel. Elle s'adresse aux patients, aux aidants familiaux et aux pharmacies.

L'application est disponible en **web** (fanafodiko.andritiana.tech) et en **mobile** (iOS & Android via Expo).

---

## 2. Problèmes résolus

### Pour les patients et aidants
| Problème                                                    | Solution Fanafodiko                                                                    |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Oublier de prendre un médicament                            | Rappels automatiques email + push + notifications locales à l'heure exacte             |
| Gérer les traitements de toute la famille                   | Un seul compte, plusieurs membres du foyer, chacun avec son propre planning            |
| Ne pas savoir si un médicament est disponible en pharmacie  | Recherche en temps réel : les pharmacies proches répondent en quelques minutes         |
| Ne pas connaître les horaires ou les gardes d'une pharmacie | Carte interactive avec statuts en direct, horaires hebdomadaires, calendrier de gardes |
| Perdre le suivi de l'observance thérapeutique               | Dashboard avec taux d'adhérence, historique complet, statistiques par période          |
| Avoir besoin des données sans connexion internet            | Mode hors-ligne complet sur mobile avec synchronisation automatique au retour          |

### Pour les pharmacies
| Problème                                                         | Solution Fanafodiko                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Être contacté par des clients cherchant un médicament spécifique | Alertes automatiques push + email dès qu'une recherche concerne la pharmacie         |
| Gérer ses horaires, gardes et fermetures exceptionnelles         | Interface de gestion complète (horaires hebdo, calendrier exceptions/gardes, photos) |
| Coordonner une équipe de staff                                   | Gestion des membres avec rôles (Super-admin / Admin / Staff), invitations par email  |
| Avoir une visibilité sur les demandes passées                    | Historique complet des recherches médicaments avec statuts de réponse                |

---

## 3. Fonctionnalités globales

### Gestion du foyer
- Compte unique pour gérer plusieurs membres (patient principal + proches/enfants/parents)
- Chaque membre a ses propres médicaments et son propre planning
- Relations configurables : soi-même, conjoint, enfant, parent, autre

### Gestion des médicaments
- Ajout avec nom, dosage, fréquence (quotidienne / hebdomadaire / par intervalle), horaires de prise, dates de début/fin
- Activation et désactivation d'un traitement sans le supprimer
- Modification complète à tout moment

### Planning et suivi des prises
- Vue journalière de toutes les prises prévues pour chaque membre
- Actions : Confirmer pris / Passer (sauter), en un tap
- Indicateur de progression de la journée (X sur Y prises)
- Historique complet : prises confirmées, sautées, oubliées

### Rappels automatiques
- **Email** : envoyé à l'heure exacte depuis `reminder@andritiana.tech`
- **Push mobile** : notification native sur l'appareil, même app fermée (via Expo Push)
- **Notifications locales** : planifiées sur 30 jours en avance, fonctionnent hors-ligne
- Les rappels email sont désactivables individuellement dans les paramètres

### Carte des pharmacies
- Carte interactive (Leaflet web / react-native-maps mobile) avec toutes les pharmacies
- Markers colorés : vert (ouvert), violet (de garde), bleu (24h/24), rouge (fermé)
- Filtres : Toutes / Ouvert / De garde / 24h/24
- Recherche par nom, ville, adresse, repère
- Détail pharmacie : horaires hebdomadaires, calendrier des gardes et exceptions, contacts (téléphone, WhatsApp, email), bouton "Y aller" vers l'app de navigation

### Recherche médicament (MedSearch)
- L'utilisateur saisit un nom de médicament et choisit un rayon (1 à 20 km)
- La position GPS est détectée automatiquement
- Toutes les pharmacies dans le rayon reçoivent une alerte push + email
- Les pharmacies répondent (Disponible / Indisponible) en temps réel
- L'utilisateur suit les réponses en direct et reçoit une notification push à chaque réponse
- Historique de toutes les recherches passées

### Ma Pharmacie (espace staff)
- Accessible uniquement aux membres d'une pharmacie
- Gestion des horaires, fermetures et ouvertures exceptionnelles, gardes
- Gestion des photos, informations publiques, contacts
- Gestion des membres de l'équipe avec rôles
- Réception et traitement des demandes de médicaments en temps réel
- Historique des recherches reçues

### Notifications push (mobile)
- Enregistrement automatique du token Expo à la connexion
- Suppression du token à la déconnexion
- Push pour : rappels médicaments, réponses de recherche (✅/❌), nouvelles demandes staff
- Navigation directe vers l'écran concerné au tap de la notification

### Mode hors-ligne (mobile)
- Toutes les données sont stockées localement en SQLite
- Les actions (prise, saut, création/modification médicament, membres) sont mises en queue et rejouées à la reconnexion
- Pharmacies pré-synchronisées quotidiennement pour consultation offline
- Blocage des opérations qui nécessitent une connexion (recherche médicament, réponse pharmacie, modification pharmacie)

### Préférences notifications email
- **5 types** configurables individuellement, organisés en deux groupes :
  - *Utilisateur* : rappels médicaments · décision demande de pharmacie · mise à jour signalement de bug
  - *Membre de pharmacie* : nouvelle demande de médicament · invitation à gérer une pharmacie
- Par défaut tous les emails sont activés ; les anciens comptes (sans les nouveaux champs) reçoivent le fallback `true`
- Les notifications push et in-app ne sont pas désactivables

### Aide & FAQ
- Base de 45 questions réparties en 8 catégories (Mon compte, Médicaments, Foyer, Pharmacies, MedSearch, Gérer ma pharmacie, Notifications, Données & confidentialité, Problèmes techniques)
- Données centralisées dans `packages/utils/src/faq.ts` (partagé web + mobile)
- Recherche plein-texte sur question, réponse et tags
- Accessible **sans connexion** (page ouverte sur le web, depuis les pages auth et depuis le menu)

### Sécurité et compte
- Inscription gratuite (email + mot de passe)
- Session persistante (JWT stocké en cookie HttpOnly web / AsyncStorage mobile)
- Réinitialisation de mot de passe par email (code valable 15 minutes)
- Modification email et mot de passe depuis les paramètres
- Rôles utilisateur : user / admin / support

### Backoffice (admin/support)
- Gestion de toutes les pharmacies (création, modification, suppression)
- Gestion des utilisateurs (rôles user/admin/support)
- Vue et gestion de toutes les recherches médicaments
- Gestion des demandes d'ajout de pharmacie (approbation, refus avec motif, attribution de gestion)
- Gestion des signalements de bugs : liste, mise à jour du statut (résolu/annulé) avec message admin

---

## 4. Pages, Application web

### Authentification

#### `/login`, Connexion
- Formulaire email + mot de passe
- Lien vers inscription et mot de passe oublié
- Redirection automatique vers `/dashboard` si déjà connecté

#### `/register`, Inscription
- Formulaire : email, mot de passe, prénom, nom
- Acceptation des CGU obligatoire
- Création automatique d'un premier profil "soi-même"

#### `/forgot-password`, Mot de passe oublié
- Saisie de l'email → envoi d'un code par email

#### `/reset-password`, Réinitialisation du mot de passe
- Saisie du code reçu par email + nouveau mot de passe

---

### Espace utilisateur

#### `/schedule`, Planning du jour *(page principale)*
- Sélecteur de membre du foyer (dropdown avec avatars + bouton d'ajout)
- Raccourcis : "Gérer le foyer" / "Gérer les médicaments"
- Carte de progression : X sur Y prises effectuées, barre d'adhérence
- Liste des prises du jour avec TaskCards :
  - Nom du médicament + dosage + heure prévue
  - Statut en couleur (Pris / Sauté / Oublié / En attente)
  - Boutons Confirmer / Passer pour les prises en attente
- État vide avec bouton "Nouveau traitement"
- Dialogs intégrés : ajout membre foyer / ajout médicament

#### `/dashboard`, Tableau de bord statistiques
- Sélecteurs : membre (tout le foyer ou individuel) + plage temporelle (Aujourd'hui / 7j / 30j / 6 mois)
- Carte adhérence : pourcentage global, barre de progression, compteurs Prises / Sautées / Oublis / Traitements actifs
- Activité récente : les 10 dernières actions (prise, saut, oubli) avec médicament, membre, heure, statut
- Colonne latérale : conseil santé, liste des membres actifs avec nombre de médicaments
- Lien vers la gestion du foyer

#### `/medications`, Gestion des médicaments
- Liste de tous les médicaments par membre
- Création, modification, suppression, activation/désactivation
- Formulaire : nom, dosage, fréquence, horaires, dates de traitement

#### `/household`, Gestion du foyer
- Liste de tous les membres avec avatars
- Ajout, modification, suppression de membres
- Relations : soi-même, conjoint, enfant, parent, autre

#### `/account`, Paramètres du compte
- Informations du compte : email actuel affiché
- Modification de l'adresse email (avec vérification mot de passe)
- Modification du mot de passe (avec vérification ancien mot de passe)
- **Notifications email — Utilisateur** : toggles rappels médicaments / décision demande pharmacie / mise à jour signalement
- **Notifications email — Membre de pharmacie** : toggles nouvelle demande médicament / invitation pharmacie
- Préférences d'affichage : sélecteur taille de police (Petit / Moyen / Grand)

---

### Pharmacies et recherche

#### `/map`, Carte des pharmacies
- Carte Leaflet pleine page avec tous les markers de pharmacies
- **Panneau latéral (desktop) / bottom sheet (mobile)** :
  - Filtres pills : Toutes / Ouvert / De garde / 24h/24
  - Barre de recherche (nom, ville, adresse, repère)
  - Compteur de résultats
  - Liste scrollable des pharmacies filtrées
  - Bouton "Suggérer une pharmacie"
- **Sur la carte** : markers colorés, tap pour ouvrir le `PharmacyDetailSheet`
- `PharmacyDetailSheet` (panel glissant) :
  - Nom + badge statut (ouvert/garde/fermé/24h)
  - Adresse + repère + ville
  - Contacts cliquables (téléphone, WhatsApp, email)
  - Horaires de la semaine (tableau 7 jours)
  - Calendrier : gardes programmées + exceptions (ouvertures/fermetures)
  - Bouton "Y aller" → app de navigation
- Bouton flottant filtre actif sur mobile

#### `/suggest-pharmacy`, Suggérer une pharmacie
- Formulaire de suggestion : nom, adresse, ville, contact
- Permet aux utilisateurs de signaler une pharmacie manquante

#### `/med-search`, Recherche de médicament
- Carte "Mes recherches" avec compteur + lien vers l'historique
- Formulaire :
  - Nom du médicament (requis)
  - Sélection du rayon : 5 pills [1 / 2 / 5 / 10 / 20 km]
  - Champ GPS : états (détection / accordé avec coordonnées / refusé avec instructions / bouton d'autorisation)
  - Note optionnelle
  - Bouton "Lancer la recherche" (désactivé sans GPS)
- Soumission → redirection vers `/med-search/:id`

#### `/med-search/:id`, Résultats en temps réel
- Médicament cherché + rayon + statut (En cours / Terminée)
- Timer d'expiration (2 heures)
- Compteurs : pharmacies notifiées / réponses reçues / disponibles
- Flux de réponses en temps réel (SSE) :
  - Badge ✅ Disponible ou ❌ Indisponible
  - Nom de la pharmacie, distance, note, heure de réponse
- État vide animé "En attente des pharmacies…"
- Tri automatique : disponibles en premier, puis par distance

#### `/med-search/history`, Historique des recherches
- Liste de toutes les recherches passées
- Pour chaque recherche : médicament, date, nb pharmacies notifiées, nb réponses, statut final
- Tap → `/med-search/:id` en mode lecture

---

### Ma Pharmacie (espace staff)

#### `/my-pharmacy`, Liste des pharmacies gérées
- Cartes par pharmacie : nom, ville, badge de rôle (Super-admin / Admin / Staff)
- Redirection automatique si l'utilisateur ne gère qu'une seule pharmacie
- **Alerte demandes en attente** : `PharmacySearchAlert`, modal plein écran si nouvelles demandes de médicaments, avec boutons Disponible / Indisponible, navigation entre demandes

#### `/my-pharmacy/:id`, Gestion d'une pharmacie (7 onglets)

**Vue d'ensemble**
- Badge statut temps réel (ouvert/garde/fermé/24h)
- Adresse + rôle de l'utilisateur connecté
- Horaire du jour (ou "Ouvert 24h/24")
- Statistiques rapides : jours ouverts/semaine, gardes actives, exceptions, photos
- Planning hebdomadaire complet (7 lignes : jour + horaire ou "Fermé")

**Informations** *(Admin+)*
- Édition : nom, adresse, repère visuel, ville, région
- Sélecteur de position sur la carte
- Gestionnaire de contacts (téléphone, email, WhatsApp, etc.)

**Horaires** *(Staff+)*
- Toggle "Ouvert 24h/24"
- Éditeur d'horaires hebdomadaires (7 jours × ouverture/fermeture/fermé)

**Calendrier** *(Staff+)*
- Gestion des ouvertures et fermetures exceptionnelles (jours fériés, vacances…) : type, dates, horaires, motif
- Gestion des plages de garde déclarées : dates de début/fin, label, activation

**Photos** *(Staff+)*
- Upload et gestion des photos de la pharmacie

**Membres** *(Staff+)*
- Liste du personnel avec rôles
- Invitation de nouveaux membres par email
- Gestion des rôles

**Historique** *(Staff+)*
- Toutes les recherches médicaments reçues par la pharmacie
- Filtre : Toutes / Confirmé / Indisponible / Sans réponse
- Détail : médicament, heure, rayon, statut de réponse, note

---

### Backoffice *(admin/support uniquement)*

#### `/backoffice/pharmacies`, Gestion de toutes les pharmacies
- Liste complète avec recherche/filtres
- Création, modification, suppression de pharmacies
- Même interface 7 onglets que Ma Pharmacie (informations complètes)

#### `/backoffice/requests`, Vue de toutes les recherches médicaments
- Tableau de toutes les recherches MedSearch du système
- Filtres par statut, pharmacie, médicament

#### `/backoffice/users`, Gestion des utilisateurs
- Liste des comptes avec rôles
- Modification des rôles (user/admin/support)

---

### Autres

#### `/cgu`, Conditions Générales d'Utilisation
- Texte complet des CGU (accessible sans connexion)
- Couvre : éditeur, objet complet (médicaments + réseau pharmacies + MedSearch + gestion pharmacie), données personnelles détaillées (localisation, push tokens, pharmacie, signalements), responsabilité pharmacies tierces
- Dernière mise à jour : 3 juin 2026

#### `/help`, Aide & FAQ
- Page standalone accessible **sans connexion** (route ouverte)
- Accordéon par question (expand/collapse)
- Barre de recherche temps réel (filtre sur question, réponse, tags)
- 8 catégories, 45 questions
- Lien dans le dropdown profil navbar + sheet "Plus" mobile (web responsive) + footer des pages login et register

#### `/pharmacy-invitation/:token`, Invitation pharmacie
- Acceptation d'une invitation à rejoindre le staff d'une pharmacie via token email
- Attribue automatiquement le rôle correspondant

---

## 5. Pages, Application mobile

### Authentification

#### `(auth)/login`, Connexion mobile
- Formulaire email + mot de passe
- Lien CGU, lien inscription

#### `(auth)/register`, Inscription mobile
- Formulaire complet avec acceptation CGU

#### `(auth)/cgu`, Conditions d'utilisation
- Affichage des CGU avec bouton retour
- Dernière mise à jour : 3 juin 2026

---

### Navigation principale (6 onglets)

#### `(tabs)/index`, Accueil / Dashboard *(onglet 1)*
- Bandeau header avec prénom, date du jour, progression circulaire (% prises)
- `SyncBanner` : état de synchronisation (hors ligne / en cours / erreur)
- Section "À prendre maintenant" : prises dans les ±30 minutes
- Section "Prochaines prises" : 5 prochaines à venir
- Section "Toutes les prises du jour" : liste complète triée par heure
- Chaque `TaskCard` : médicament + dosage + heure + statut + boutons Confirmer/Passer
- État vide avec icône cloche
- Pull-to-refresh → `fullSync()`

#### `(tabs)/map`, Carte des pharmacies *(onglet 2)*
- `MapView` (react-native-maps) plein écran avec markers colorés :
  - Vert (ouvert), violet (garde), bleu (24h/24), rouge (fermé)
- Barre de recherche flottante en haut
- Pills de filtre : Toutes / Ouvert / De garde / 24h/24
- Bouton GPS (bas droite) → centrer sur position utilisateur
- Tap marker → `BottomSheet` glissant avec `PharmacyCard` :
  - Nom + badge statut + adresse + horaire du jour + téléphone
  - Bouton "Y aller" (ouvre Maps) + bouton "Voir détails"
- Banner "Carte hors ligne, données locales" si offline
- Données : online → API + upsert SQLite / offline → SQLite

#### `(tabs)/my-pharmacy`, Ma Pharmacie *(onglet 3, staff uniquement)*
- Visible uniquement si `myPharmacies.length > 0`
- Liste des pharmacies gérées : nom, ville, point de statut vert/rouge
- Pull-to-refresh
- Chip d'alerte rouge "X demandes" si demandes en attente
- `PendingSearchModal` (modal plein écran) :
  - Nom du médicament en grand, pharmacie concernée, rayon, note, heure
  - Boutons Disponible ✅ / Indisponible ❌
  - Navigation entre demandes (flèches + dots) si plusieurs
  - Poll automatique toutes les 30 secondes

#### `(tabs)/med-search`, Recherche médicament *(onglet 4, FAB central)*
- **Offline** : message "Connexion requise" + icône
- **Online** : formulaire complet
  - Champ médicament avec icône loupe
  - Sélecteur de rayon (5 pills : 1/2/5/10/20 km)
  - Note optionnelle (textarea)
  - Infos contextuelles (nb pharmacies notifiées, durée 2h)
  - Bouton "Lancer la recherche" → géolocalisation + `POST /med-searches`
- Bouton "Historique" en haut à droite

#### `(tabs)/members`, Membres du foyer *(onglet 5)*
- Liste des membres avec avatar, prénom, nb de médicaments actifs
- Tap → `member/[id]`
- Bouton ajout de membre

#### `(tabs)/settings`, Réglages *(onglet 6)*
- Profil : email + ID utilisateur
- Section Synchronisation : statut online/offline + bouton sync manuelle
- Section Serveur API : URL configurable (utile en développement)
- Section Notifications locales : toggle activation + bouton re-planifier 30 jours
- **Section Notifications email — Utilisateur** (online uniquement) :
  - Toggle rappels médicaments (`emailMedicationReminders`)
  - Toggle décision demande de pharmacie (`emailPharmacyRequestDecision`)
  - Toggle mise à jour signalement (`emailBugReportUpdate`)
  - Note : "Les notifications push et in-app ne peuvent pas être désactivées"
- **Section Notifications email — Membre de pharmacie** (online uniquement) :
  - Toggle nouvelle demande médicament (`emailMedSearchResponse`)
  - Toggle invitation à gérer une pharmacie (`emailPharmacyInvitation`)
- Section Données : info stockage local SQLite + explication offline
- **Section Aide** :
  - "Centre d'aide & FAQ" → navigue vers `/(app)/help`
  - "Signaler un problème" → modal de signalement de bug
- Section À propos : version
- Bouton Déconnexion (supprime le push token avant de vider la session)

---

### Écrans de détail (stack)

#### `pharmacy/[id]`, Détail d'une pharmacie
- Header : nom + badge statut (ouvert/garde/fermé/24h)
- `SyncBanner`
- Carte infos : adresse, repère visuel, ville, horaire du jour
- Section Contacts : téléphone (→ appel), WhatsApp (→ WA), email (→ mail)
- Section Horaires : tableau 7 jours avec horaires ou "Fermé"
- Section Calendrier : gardes actives + exceptions à venir (badges colorés, dates, notes)
- Bouton "Y aller" → ouvre l'app de navigation
- 100% accessible offline depuis le cache SQLite

#### `med-search/[id]`, Résultats en temps réel
- **Offline** : message + lien vers l'historique
- **Online** : polling `GET /med-searches/:id` toutes les 5 secondes
- Header : médicament + rayon + badge En cours/Terminée + timer expiration
- Statistiques : pharmacies notifiées / réponses / disponibles
- Liste de réponses :
  - Card ✅ verte ou ❌ rouge
  - Nom pharmacie + note + distance + heure de réponse
  - Triées : disponibles en premier, puis par distance
- État vide : spinner "En attente des pharmacies…" avec nombre de notifiées
- Bouton rafraîchir manuel
- Polling s'arrête quand `status === 'closed'`

#### `med-search/history`, Historique des recherches
- Liste avec pull-to-refresh
- Chaque item : médicament, date/heure, nb notifiées, nb réponses, badge ✅/❌/statut actif
- Tap → `med-search/[id]` (lecture seule si terminée)

#### `member/[id]`, Détail d'un membre
- Infos du membre (nom, relation, date de naissance)
- Liste de ses médicaments avec statut actif/inactif
- Ajout, modification, activation/désactivation

#### `help`, Aide & FAQ
- Barre de recherche native avec filtre temps réel (question, réponse, tags)
- Liste accordéon : tap pour expand/collapse une réponse avec animation `LayoutAnimation`
- Catégories affichées en sections (titre majuscule) quand pas de recherche active
- Résultats filtrés en mode recherche
- Message "Aucun résultat" avec email de contact
- Accessible depuis Réglages > Aide > "Centre d'aide & FAQ"

#### `my-pharmacy/[id]`, Gestion d'une pharmacie (staff)
- Header : nom + badge statut
- `SyncBanner`
- Section Demandes en attente : cards avec médicament + boutons Disponible/Indisponible
- Section Aujourd'hui : horaire du jour + adresse
- Section Horaires hebdomadaires : tableau 7 jours
- Section Calendrier : gardes actives + exceptions à venir
- Pull-to-refresh
- Modifications bloquées offline avec message "Connexion requise"

---

## 6. Architecture technique

| Couche              | Technologie                                         |
| ------------------- | --------------------------------------------------- |
| Backend             | Bun + Hono + MongoDB (Mongoose) + ClickHouse        |
| Frontend web        | React 19 + Vite + TailwindCSS + shadcn/ui + Leaflet |
| Mobile              | Expo 54 (React Native 0.81) + Expo Router + SQLite  |
| Schémas partagés    | Zod (`packages/schemas`)                            |
| Utilitaires partagés | Validateurs + données FAQ (`packages/utils`)        |
| Authentification    | JWT (cookie HttpOnly web / AsyncStorage mobile)     |
| Email               | Resend                                              |
| Push notifications  | Expo Push API                                       |
| Temps réel (web)    | SSE (Server-Sent Events)                            |
| Temps réel (mobile) | Polling 5s (med-search) / 30s (staff pending)       |
| Offline (mobile)    | SQLite + queue d'actions → replay à la reconnexion  |
| Monorepo            | pnpm + Turbo                                        |

---

## 7. Utilisateurs cibles

| Profil                    | Usage principal                                                            |
| ------------------------- | -------------------------------------------------------------------------- |
| **Patient**               | Gérer ses propres traitements, recevoir des rappels, confirmer ses prises  |
| **Aidant / Proche**       | Gérer les médicaments de plusieurs membres de la famille en un seul compte |
| **Staff pharmacie**       | Recevoir les demandes de médicaments, y répondre, gérer les horaires       |
| **Admin pharmacie**       | Gestion complète de la pharmacie (infos, staff, calendrier)                |
| **Super-admin pharmacie** | Droits complets sur une pharmacie                                          |
| **Admin plateforme**      | Backoffice : gestion de toutes les pharmacies et utilisateurs              |

---

## 8. Ce que Fanafodiko n'est pas

- Ce n'est pas une application de téléconsultation médicale
- Ce n'est pas un système de commande en ligne de médicaments
- Ce n'est pas un remplacement de l'avis d'un médecin ou pharmacien
- Les données médicales ne sont jamais vendues ni partagées

---

*Développé par Andritiana Steve Rakotonimanana, pro@andritiana.tech*
