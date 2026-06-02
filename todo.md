# 📋 TODO — Améliorations & Modifications

---

## 🗂️ Légende
- `[ ]` À faire
- `[~]` En cours
- `[x]` Terminé

---

## 1. 🕐 Gestion des horaires de pharmacie
- [ ] Permettre aux membres d'une pharmacie de **modifier leurs heures d'ouverture** régulières (par jour de la semaine)
- [ ] Permettre de **déclarer et gérer les gardes** :
  - Définir une plage de garde avec date de début et date de fin
  - Gérer le cas où la garde ne dure qu'un seul jour (et non toute une semaine)
  - Intégrer un **react-calendar** pour visualiser et saisir les gardes de manière contrôlée
- [ ] Permettre de **créer des ouvertures exceptionnelles** (date début + date fin + horaires)
- [ ] Permettre de **créer des fermetures exceptionnelles** (date début + date fin + motif optionnel)
- [ ] Afficher un **tableau listant toutes les ouvertures et fermetures exceptionnelles** avec possibilité de :
  - Modifier chaque entrée
  - Annuler / supprimer une entrée

---

## 2. 🏥 Redirection /my-pharmacy
- [ ] Si l'utilisateur connecté n'est associé qu'à **une seule pharmacie**, rediriger automatiquement vers la page de détails de cette pharmacie sans passer par la liste

---

## 3. 🗺️ Drawer de la carte principale
- [ ] **Supprimer** le bouton permettant de masquer le drawer sur desktop (le drawer doit rester toujours visible en `md:flex`)
  - Supprimer le bouton : `hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-[800] ...`
  - Le drawer `w-96` doit être fixe et non rétractable en desktop
- [ ] Lorsqu'on **clique sur une pharmacie dans le drawer**, effectuer un `flyTo` avec un **zoom très grand** (ex: zoom 18) centré sur la pharmacie sélectionnée

---

## 4. 📍 LocationPickerMap — Centrage initial
- [ ] Fichier : `apps/frontend/src/features/pharmacy/components/LocationPickerMap.tsx`
- [ ] **Supprimer** la section/position sélectionnée par défaut au montage du composant
- [ ] Au lieu de cela, **centrer la carte sur la localisation de l'utilisateur** via `navigator.geolocation.getCurrentPosition`
- [ ] Si la géolocalisation est refusée ou indisponible, afficher une position neutre (ex : centre de Madagascar)

---

## 5. 🛠️ Backoffice — Gestion du staff des pharmacies
- [ ] Rendre la procédure d'ajout d'un admin de pharmacie **plus formelle et détaillée** (instructions claires, confirmation email, etc.)
- [ ] Créer une **page de gestion du staff** par pharmacie accessible depuis le backoffice :
  - Liste des membres avec leur rôle (STAFF, ADMIN, SUPERADMIN)
  - Boutons pour : ajouter, modifier le rôle, retirer un membre
  - L'**admin de l'app** peut modifier ou retirer **même les superadmins** de pharmacie
- [ ] Le **superadmin de pharmacie** aura aussi accès à une page de gestion de son propre staff (dans `/my-pharmacy`)
- [ ] Toutes les features admin possibles doivent être présentes, **sauf l'impersonation**

---

## 6. 📄 Page /my-pharmacy/[id] — Refonte et audit trail
- [ ] À l'arrivée sur `/my-pharmacy/[id]`, atterrir sur une **page de résumé / dashboard** :
  - Infos clés, horaires, statut de garde, dernières modifications, membres actifs
- [ ] Créer des **sous-pages séparées** pour la modification (ne plus avoir un seul gros formulaire) :
  - `/my-pharmacy/[id]/edit/info` — Nom, contact, description
  - `/my-pharmacy/[id]/edit/location` — Localisation / carte
  - `/my-pharmacy/[id]/edit/hours` — Horaires d'ouverture
  - `/my-pharmacy/[id]/edit/exceptional` — Ouvertures/fermetures exceptionnelles
- [ ] **Audit trail** : enregistrer et afficher dans l'interface :
  - Qui a modifié quoi et quand (champ par champ si possible)
  - Qui a ajouté quel membre et quand
  - Qui a retiré quel membre et quand

---

## 7. 🚨 Système de garde — Backoffice
- [ ] Remplacer l'actuel système de déclaration de garde (semaine entière) par un système **basé sur des plages de dates précises**
- [ ] Intégrer un **react-calendar** dans le backoffice pour visualiser les gardes déclarées
- [ ] Permettre de déclarer une garde sur **un seul jour** (et non forcément une semaine complète)
- [ ] Réutiliser les ouvertures/fermetures exceptionnelles comme source de vérité pour l'affichage des gardes
- [ ] Appliquer la même logique de calendrier pour les **admins de pharmacie** dans leur espace `/my-pharmacy`

---

## 8. 📝 /suggest-pharmacy — Navigation multi-étapes
- [ ] Remplacer le bouton **"Envoyer la demande"** par un bouton **"Suivant"** permettant de naviguer entre les tabs séquentiellement
- [ ] Le dernier tab affichera le vrai bouton d'envoi de la demande
- [ ] Déplacer le **bouton "Ouvert 24h/24"** dans la **section "Horaires"** (pas dans "Infos")
- [ ] Rendre l'onglet **"Horaires" non désactivable** (toujours visible et requis dans le flux)

---

## 9. 📬 Backoffice — Vue des demandes d'ajout de pharmacie
- [ ] Créer une **vue détaillée** dans le backoffice pour chaque demande d'ajout de pharmacie :
  - Toutes les infos soumises (nom, adresse, horaires, contact, etc.)
  - Statut de la demande (en attente, acceptée, refusée)
  - Actions : accepter, refuser, demander des modifications
  - Historique des actions sur la demande

---

## 10. 🗺️ Layer selector sur toutes les maps
- [ ] Intégrer le composant `MapLayerSelector` (déjà créé) sur **toutes les maps de l'application** :
  - Map principale
  - `LocationPickerMap`
  - Toute autre map leaflet
- [ ] Le composant doit proposer au minimum : **Satellite** et **Light (OSM)**
- [ ] Positionner le sélecteur de manière cohérente (en bas à gauche ou en bas à droite selon le contexte)

---

## 11. 🔵 Clustering sur la map — react-leaflet-cluster
- [ ] Installer et intégrer **`react-leaflet-cluster`** sur la carte principale
- [ ] Les marqueurs de pharmacies doivent se regrouper en clusters aux niveaux de zoom faibles
- [ ] Le cluster doit afficher le nombre de pharmacies regroupées
- [ ] Au clic sur un cluster, zoomer pour décomposer le groupe

---

## 12. 🧭 Layout Sidebar — Staff pharmacie & Backoffice
- [ ] Appliquer le **layout avec sidebar shadcn/ui** (`SidebarProvider` + `AppSidebar` + `SidebarInset`) pour :
  - L'espace staff/admin de pharmacie (`/my-pharmacy`)
  - Le backoffice (`/backoffice` ou `/admin`)
- [ ] La sidebar doit être **collapsible en mode icône** (`collapsible="icon"`)
- [ ] Adapter la navigation selon le rôle de l'utilisateur connecté (STAFF, ADMIN PHARMA, SUPERADMIN PHARMA, ADMIN APP)
- [ ] S'inspirer du composant `AppSidebar` existant pour structurer les items de navigation

---

## 13. 🔔 NotificationBell — Doublon d'icône
- [ ] Fichier : `apps/frontend/src/features/notification/components/NotificationBell.tsx`
- [ ] **Corriger le doublon** : il y a 2 icônes cloche rendues dans le composant
- [ ] Ne garder qu'une seule icône cloche, correctement positionnée avec le badge de notifications

---

## 🔜 À affiner / Idées futures
- [ ] Notifications push pour les gardes (rappel avant le début d'une garde)
- [ ] Export PDF ou CSV des horaires et gardes d'une pharmacie
- [ ] Carte de chaleur des zones avec/sans pharmacie de garde
- [ ] Statistiques de fréquentation par pharmacie (vues, clics, recherches)