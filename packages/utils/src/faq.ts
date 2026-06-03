export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  tags: string[];
}

export interface FaqCategory {
  id: string;
  label: string;
  items: FaqItem[];
}

export const faqCategories: FaqCategory[] = [
  {
    id: 'compte',
    label: 'Mon compte',
    items: [
      {
        id: 'compte-creer',
        question: 'Comment créer un compte ?',
        answer:
          "Rendez-vous sur la page d'inscription et renseignez votre adresse email ainsi qu'un mot de passe d'au moins 8 caractères. Une fois inscrit, vous pouvez accéder à toutes les fonctionnalités de l'application.",
        tags: ['compte', 'inscription', 'créer', 'email', 'mot de passe'],
      },
      {
        id: 'compte-modifier-email',
        question: 'Comment modifier mon adresse email ?',
        answer:
          "Allez dans Mon compte (icône profil en haut à droite sur le web, ou Réglages sur mobile) puis dans la section « Modifier l'adresse email ». Vous devrez saisir votre mot de passe actuel pour confirmer le changement.",
        tags: ['compte', 'email', 'modifier', 'changer', 'adresse'],
      },
      {
        id: 'compte-modifier-mdp',
        question: 'Comment modifier mon mot de passe ?',
        answer:
          "Dans Mon compte, section « Modifier le mot de passe », saisissez votre mot de passe actuel puis le nouveau (8 caractères minimum). Le changement est immédiat.",
        tags: ['compte', 'mot de passe', 'modifier', 'changer', 'sécurité'],
      },
      {
        id: 'compte-mdp-oublie',
        question: 'J\'ai oublié mon mot de passe, comment le réinitialiser ?',
        answer:
          "Sur la page de connexion, cliquez sur « Mot de passe oublié » et saisissez votre adresse email. Vous recevrez un code à 6 chiffres par email, valable 15 minutes. Entrez ce code sur la page de réinitialisation pour choisir un nouveau mot de passe.",
        tags: ['compte', 'mot de passe', 'oublié', 'réinitialiser', 'email', 'code'],
      },
      {
        id: 'compte-supprimer',
        question: 'Comment supprimer mon compte ?',
        answer:
          "La suppression de compte se fait en contactant directement l'équipe via pro@andritiana.tech en indiquant l'adresse email associée à votre compte. Vos données seront supprimées dans les meilleurs délais. Notez que cette action est irréversible.",
        tags: ['compte', 'supprimer', 'suppression', 'données', 'irréversible'],
      },
      {
        id: 'compte-securite',
        question: 'Mes informations sont-elles sécurisées ?',
        answer:
          "Oui. Votre mot de passe est stocké sous forme hashée (jamais en clair). La connexion se fait via un token JWT sécurisé stocké dans un cookie HttpOnly, inaccessible au JavaScript. Aucune donnée personnelle identifiable n'est vendue à des tiers.",
        tags: ['compte', 'sécurité', 'données', 'mot de passe', 'confidentialité'],
      },
    ],
  },
  {
    id: 'medicaments',
    label: 'Médicaments & suivi',
    items: [
      {
        id: 'med-ajouter',
        question: 'Comment ajouter un médicament ?',
        answer:
          "Allez dans la section Médicaments et appuyez sur le bouton « Ajouter ». Renseignez le nom du médicament, le dosage, la fréquence de prise (quotidienne, hebdomadaire ou par intervalle), les horaires et les dates de début et de fin. Le médicament est ensuite visible dans le planning.",
        tags: ['médicament', 'ajouter', 'dosage', 'fréquence', 'horaire'],
      },
      {
        id: 'med-modifier',
        question: 'Comment modifier ou supprimer un médicament ?',
        answer:
          "Dans la liste des médicaments, appuyez sur le médicament concerné pour ouvrir sa fiche. Vous pouvez le modifier (icône crayon) ou le supprimer (icône corbeille). La suppression efface également les prises non encore effectuées associées.",
        tags: ['médicament', 'modifier', 'supprimer', 'éditer'],
      },
      {
        id: 'med-planning',
        question: 'Comment fonctionne le planning de prise ?',
        answer:
          "Le planning regroupe toutes les prises programmées pour chaque profil du foyer. Les prises apparaissent dans l'ordre chronologique. Vous pouvez les marquer comme Prise, Manquée ou Ignorée. Les prises passées non traitées sont automatiquement marquées Manquées.",
        tags: ['planning', 'prise', 'médicament', 'historique', 'manqué'],
      },
      {
        id: 'med-marquer',
        question: 'Comment marquer une prise comme effectuée ?',
        answer:
          "Dans le Planning, appuyez sur la prise souhaitée. Un menu apparaît avec les options : « Pris », « Manqué » ou « Ignoré ». Vous pouvez aussi glisser la carte pour une action rapide selon votre configuration.",
        tags: ['prise', 'marquer', 'effectué', 'pris', 'manqué', 'planning'],
      },
      {
        id: 'med-historique',
        question: 'Comment consulter l\'historique des prises ?',
        answer:
          "Dans la section Planning, utilisez les filtres de date pour naviguer dans le passé. Chaque prise indique son statut (Pris, Manqué, Ignoré) ainsi que l'heure prévue.",
        tags: ['historique', 'prise', 'planning', 'passé', 'suivi'],
      },
    ],
  },
  {
    id: 'foyer',
    label: 'Foyer',
    items: [
      {
        id: 'foyer-ajouter',
        question: 'Comment ajouter un membre au foyer ?',
        answer:
          "Dans la section Foyer, appuyez sur « Ajouter un membre ». Renseignez le prénom, le nom et la date de naissance. Le nouveau profil apparaît immédiatement et vous pouvez lui attribuer des médicaments.",
        tags: ['foyer', 'membre', 'ajouter', 'profil', 'famille'],
      },
      {
        id: 'foyer-plusieurs',
        question: 'Puis-je gérer les médicaments de plusieurs personnes ?',
        answer:
          "Oui, c'est l'une des fonctionnalités principales de Fanafodiko. Chaque membre du foyer possède son propre profil avec ses médicaments et son planning. Vous pouvez passer d'un profil à l'autre depuis le planning.",
        tags: ['foyer', 'plusieurs', 'profil', 'famille', 'aidant'],
      },
      {
        id: 'foyer-modifier',
        question: 'Comment modifier ou supprimer un membre du foyer ?',
        answer:
          "Dans la section Foyer, appuyez sur le membre concerné. Vous pouvez modifier ses informations ou supprimer son profil. Attention : supprimer un profil supprime également tous ses médicaments et son historique de prises.",
        tags: ['foyer', 'modifier', 'supprimer', 'profil', 'membre'],
      },
    ],
  },
  {
    id: 'pharmacies',
    label: 'Pharmacies',
    items: [
      {
        id: 'pharma-trouver',
        question: 'Comment trouver une pharmacie près de chez moi ?',
        answer:
          "Allez sur la Carte (onglet ou menu) pour afficher toutes les pharmacies géolocalisées. Vous pouvez vous recentrer sur votre position en appuyant sur le bouton de localisation. Appuyez sur un marqueur pour voir les informations de la pharmacie.",
        tags: ['pharmacie', 'carte', 'localisation', 'près', 'trouver', 'géolocalisation'],
      },
      {
        id: 'pharma-garde',
        question: 'Comment voir les pharmacies de garde ?',
        answer:
          "Sur la page Carte ou dans la fiche d'une pharmacie, les pharmacies de garde sont identifiées par une icône spécifique. Les gardes exceptionnelles (week-ends, jours fériés) sont également renseignées par les pharmacies elles-mêmes.",
        tags: ['pharmacie', 'garde', 'nuit', 'urgence', 'week-end', 'horaire'],
      },
      {
        id: 'pharma-horaires',
        question: 'Comment consulter les horaires d\'une pharmacie ?',
        answer:
          "Appuyez sur une pharmacie sur la carte ou dans la liste pour accéder à sa fiche détaillée. Vous y trouvez ses horaires d'ouverture habituels, ses gardes exceptionnelles, ses contacts (téléphone, email) et son adresse.",
        tags: ['pharmacie', 'horaire', 'ouverture', 'fiche', 'contact'],
      },
      {
        id: 'pharma-contacter',
        question: 'Comment contacter une pharmacie ?',
        answer:
          "Dans la fiche de la pharmacie, les coordonnées (numéro de téléphone, email) sont affichées si elles ont été renseignées par la pharmacie. Appuyez sur le numéro pour appeler directement depuis votre appareil mobile.",
        tags: ['pharmacie', 'contact', 'téléphone', 'appeler', 'email'],
      },
      {
        id: 'pharma-erreur',
        question: 'Les informations d\'une pharmacie sont incorrectes, que faire ?',
        answer:
          "Les informations des pharmacies sont gérées par leurs membres dans l'application. Si vous constatez une erreur, vous pouvez la signaler via le formulaire « Signaler un problème » (accessible depuis le menu) en précisant le nom de la pharmacie et la correction nécessaire.",
        tags: ['pharmacie', 'erreur', 'incorrect', 'signaler', 'informations'],
      },
    ],
  },
  {
    id: 'medsearch',
    label: 'Recherche de médicaments',
    items: [
      {
        id: 'search-lancer',
        question: 'Comment savoir si un médicament est disponible en pharmacie ?',
        answer:
          "Utilisez la fonctionnalité Recherche (MedSearch). Entrez le nom du médicament, sélectionnez un rayon de recherche (1 à 50 km), et lancez la recherche. Les pharmacies dans ce rayon reçoivent votre demande et peuvent confirmer ou infirmer la disponibilité.",
        tags: ['recherche', 'médicament', 'disponible', 'pharmacie', 'MedSearch', 'trouver'],
      },
      {
        id: 'search-fonctionnement',
        question: 'Comment fonctionne le rayon de recherche ?',
        answer:
          "Votre position approximative est utilisée pour identifier les pharmacies dans le rayon choisi. Cette position n'est pas stockée de façon permanente. Plus le rayon est large, plus il y a de pharmacies notifiées, mais les résultats peuvent être moins pertinents si vous cherchez une pharmacie accessible à pied.",
        tags: ['recherche', 'rayon', 'localisation', 'proximité', 'kilomètres'],
      },
      {
        id: 'search-reponse',
        question: 'Comment une pharmacie répond-elle à ma demande ?',
        answer:
          "Chaque pharmacie dans le rayon reçoit une notification (push et email si activé). Depuis leur interface, les membres de la pharmacie peuvent répondre « Disponible » ou « Indisponible ». Vous recevez une notification push et une notification in-app pour chaque réponse.",
        tags: ['recherche', 'réponse', 'pharmacie', 'notification', 'disponible'],
      },
      {
        id: 'search-duree',
        question: 'Pendant combien de temps ma recherche est-elle active ?',
        answer:
          "Les recherches restent actives et les pharmacies peuvent y répondre jusqu'à ce que vous en lanciez une nouvelle ou que la demande soit traitée. Vous pouvez consulter l'historique de vos recherches passées dans la section Historique de l'écran Recherche.",
        tags: ['recherche', 'durée', 'active', 'historique', 'expiration'],
      },
      {
        id: 'search-historique',
        question: 'Comment voir l\'historique de mes recherches ?',
        answer:
          "Dans la section Recherche, un bouton « Historique » vous donne accès à toutes vos recherches précédentes ainsi que les réponses reçues pour chacune.",
        tags: ['recherche', 'historique', 'passé', 'résultats'],
      },
    ],
  },
  {
    id: 'ma-pharmacie',
    label: 'Gérer ma pharmacie',
    items: [
      {
        id: 'pharmacie-ajouter',
        question: 'Comment ajouter ma pharmacie dans l\'application ?',
        answer:
          "Depuis la section Carte ou via « Suggérer une pharmacie » dans le menu, remplissez le formulaire de demande d'ajout (nom, adresse, coordonnées GPS, horaires, contacts). Votre demande est ensuite examinée par l'équipe de Fanafodiko. Vous serez notifié par email de la décision.",
        tags: ['pharmacie', 'ajouter', 'demande', 'suggérer', 'inscription', 'réseau'],
      },
      {
        id: 'pharmacie-assigner',
        question: 'Ma pharmacie est déjà dans l\'application, comment y être assigné ?',
        answer:
          "Contactez le superadmin ou l'administrateur de votre pharmacie dans l'application. Il peut vous envoyer une invitation par email depuis la section Membres de la pharmacie. Acceptez l'invitation via le lien reçu par email pour rejoindre la pharmacie avec le rôle qui vous a été attribué.",
        tags: ['pharmacie', 'assigné', 'rejoindre', 'invitation', 'membre', 'staff', 'rôle'],
      },
      {
        id: 'pharmacie-roles',
        question: 'Quels sont les différents rôles dans une pharmacie ?',
        answer:
          "Il existe 3 rôles :\n• Superadmin : gestionnaire principal de la pharmacie, peut inviter des administrateurs et du staff, modifier toutes les informations.\n• Admin : peut gérer le staff, les horaires, les gardes et répondre aux demandes.\n• Staff : peut répondre aux demandes de médicaments des patients.",
        tags: ['pharmacie', 'rôle', 'superadmin', 'admin', 'staff', 'permissions'],
      },
      {
        id: 'pharmacie-inviter',
        question: 'Comment inviter un collaborateur à gérer ma pharmacie ?',
        answer:
          "Dans Ma pharmacie > Membres, appuyez sur « Inviter un membre ». Entrez son adresse email et choisissez son rôle (admin ou staff). Il recevra un email avec un lien d'invitation valable 7 jours. Une invitation est nécessaire même si la personne a déjà un compte Fanafodiko.",
        tags: ['pharmacie', 'inviter', 'membre', 'collaborateur', 'email', 'invitation'],
      },
      {
        id: 'pharmacie-horaires',
        question: 'Comment modifier les horaires d\'ouverture de ma pharmacie ?',
        answer:
          "Dans Ma pharmacie > Horaires, vous pouvez définir les horaires d'ouverture pour chaque jour de la semaine ainsi que l'indicateur « Ouvert 24h/24 ». Les modifications sont visibles immédiatement pour tous les utilisateurs de l'application.",
        tags: ['pharmacie', 'horaires', 'ouverture', 'modifier', 'semaine'],
      },
      {
        id: 'pharmacie-gardes',
        question: 'Comment déclarer une garde exceptionnelle ?',
        answer:
          "Dans Ma pharmacie > Calendrier des gardes, ajoutez une garde en spécifiant la date et les horaires. Les gardes sont affichées sur la fiche de votre pharmacie et sur la carte pour alerter les patients.",
        tags: ['pharmacie', 'garde', 'exceptionnelle', 'calendrier', 'nuit', 'week-end'],
      },
      {
        id: 'pharmacie-repondre',
        question: 'Comment répondre à une demande de médicament (MedSearch) ?',
        answer:
          "Quand un patient lance une recherche de médicament dans votre rayon, vous recevez une notification push et un email (si activé). Depuis Ma pharmacie > Activité ou depuis la notification, vous pouvez répondre « Disponible » ou « Indisponible ». Le patient est immédiatement notifié.",
        tags: ['pharmacie', 'demande', 'médicament', 'répondre', 'disponible', 'MedSearch'],
      },
      {
        id: 'pharmacie-infos',
        question: 'Comment mettre à jour les informations de ma pharmacie ?',
        answer:
          "Dans Ma pharmacie > Informations, vous pouvez modifier le nom, l'adresse, les contacts (téléphone, email), les images et la description. Dans Ma pharmacie > Images, vous pouvez ajouter ou supprimer des photos de votre établissement.",
        tags: ['pharmacie', 'informations', 'modifier', 'adresse', 'contact', 'image', 'photo'],
      },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    items: [
      {
        id: 'notif-activer-push',
        question: 'Comment activer les notifications push sur mobile ?',
        answer:
          "Au premier lancement de l'application mobile, une demande de permission est affichée. Si vous l'avez refusée, allez dans les Réglages de votre téléphone > Applications > Fanafodiko > Notifications et activez-les manuellement. Sur l'app, dans Réglages > Notifications locales, vous pouvez aussi re-planifier les rappels.",
        tags: ['notification', 'push', 'activer', 'permission', 'réglages', 'mobile'],
      },
      {
        id: 'notif-pas-rappels',
        question: 'Pourquoi je ne reçois pas mes rappels de médicaments ?',
        answer:
          "Vérifiez les points suivants :\n1. Les notifications push sont autorisées dans les réglages de votre téléphone.\n2. Dans Réglages > Notifications locales, le toggle est activé.\n3. Appuyez sur « Re-planifier 30 jours » pour forcer la reprogrammation des rappels.\n4. Vérifiez que vos médicaments ont bien des horaires définis dans leur fiche.",
        tags: ['notification', 'rappel', 'médicament', 'problème', 'recevoir', 'push'],
      },
      {
        id: 'notif-email-prefs',
        question: 'Comment configurer mes préférences de notifications email ?',
        answer:
          "Sur le web : Mon compte > Notifications par email. Sur mobile : Réglages > Notifications email. Vous pouvez activer ou désactiver chaque type d'email indépendamment. Par défaut, tous les emails sont activés.",
        tags: ['notification', 'email', 'préférence', 'configurer', 'activer', 'désactiver'],
      },
      {
        id: 'notif-obligatoires',
        question: 'Quelles notifications ne peuvent pas être désactivées ?',
        answer:
          "Les notifications push (mobile) et in-app (cloche dans l'application) sont obligatoires pour assurer le bon fonctionnement du service. Seules les notifications email sont personnalisables.",
        tags: ['notification', 'obligatoire', 'push', 'in-app', 'désactiver'],
      },
    ],
  },
  {
    id: 'donnees',
    label: 'Données & confidentialité',
    items: [
      {
        id: 'data-collectees',
        question: 'Quelles données sont collectées par l\'application ?',
        answer:
          "Fanafodiko collecte : votre adresse email (compte), les informations de profils du foyer (prénom, nom, date de naissance), vos médicaments et historique de prises, votre position approximative lors des recherches MedSearch (non stockée en permanence), les tokens de notification push de votre appareil, et les informations de signalements de bugs. Consultez nos CGU pour le détail complet.",
        tags: ['données', 'collectées', 'confidentialité', 'privacy', 'RGPD'],
      },
      {
        id: 'data-hors-ligne',
        question: 'L\'application fonctionne-t-elle hors connexion ?',
        answer:
          "L'application mobile fonctionne en mode hors ligne pour la consultation et la saisie de données. Les prises de médicaments peuvent être marquées sans connexion. Les données sont synchronisées automatiquement dès le retour de la connexion, ou manuellement via Réglages > Synchroniser maintenant.",
        tags: ['hors ligne', 'offline', 'synchronisation', 'connexion', 'mode'],
      },
      {
        id: 'data-sync',
        question: 'Comment synchroniser mes données manuellement ?',
        answer:
          "Sur l'application mobile : Réglages > Synchroniser maintenant. La date et l'heure de la dernière synchronisation sont affichées. Si vous avez plusieurs appareils, assurez-vous d'être connecté au même compte pour partager vos données.",
        tags: ['synchronisation', 'sync', 'données', 'manuel', 'appareils'],
      },
      {
        id: 'data-supprimer',
        question: 'Comment supprimer mes données personnelles ?',
        answer:
          "Pour demander la suppression de vos données, contactez pro@andritiana.tech depuis l'adresse email associée à votre compte. Précisez « Suppression de données » dans l'objet. Toutes vos données seront effacées dans les meilleurs délais.",
        tags: ['données', 'supprimer', 'effacer', 'droit', 'RGPD', 'privacy'],
      },
    ],
  },
  {
    id: 'technique',
    label: 'Problèmes techniques',
    items: [
      {
        id: 'tech-connexion-serveur',
        question: 'L\'application affiche « Impossible de se connecter au serveur »',
        answer:
          "Vérifiez votre connexion internet. Sur l'application mobile (en développement local), vérifiez que l'URL du backend est correctement configurée dans Réglages > URL du serveur. En production, si le problème persiste, signalez-le via « Signaler un problème ».",
        tags: ['serveur', 'connexion', 'erreur', 'backend', 'URL', 'technique'],
      },
      {
        id: 'tech-connexion-compte',
        question: 'Je n\'arrive pas à me connecter à mon compte',
        answer:
          "Vérifiez que votre adresse email et votre mot de passe sont corrects (attention aux majuscules). Si vous avez oublié votre mot de passe, utilisez la fonction « Mot de passe oublié » sur la page de connexion. Si le problème persiste, contactez pro@andritiana.tech.",
        tags: ['connexion', 'compte', 'mot de passe', 'email', 'oublié', 'problème'],
      },
      {
        id: 'tech-bug',
        question: 'Comment signaler un bug ou un problème ?',
        answer:
          "Utilisez le formulaire « Signaler un problème » accessible depuis le menu (icône bulle d'avertissement). Décrivez le problème en détail : ce que vous faisiez, ce qui s'est passé et comment le reproduire. Des informations techniques (OS, taille d'écran) sont jointes automatiquement. Vous serez notifié par email ou in-app lorsque votre signalement aura été traité.",
        tags: ['bug', 'signaler', 'problème', 'erreur', 'rapport', 'contact'],
      },
      {
        id: 'tech-donnees-perdues',
        question: 'Mes données ont disparu après une mise à jour',
        answer:
          "Si vos données n'apparaissent plus, vérifiez que vous êtes connecté au bon compte (Mon compte > email affiché). Sur mobile, lancez une synchronisation manuelle via Réglages > Synchroniser maintenant. Si le problème persiste, contactez-nous immédiatement à pro@andritiana.tech.",
        tags: ['données', 'disparues', 'perdues', 'mise à jour', 'synchronisation'],
      },
      {
        id: 'tech-lenteur',
        question: 'L\'application est lente ou se fige',
        answer:
          "Essayez de fermer et relancer l'application. Sur mobile, vérifiez que vous disposez d'une connexion suffisante pour les opérations qui nécessitent le serveur. Si le problème est récurrent, signalez-le via « Signaler un problème » en décrivant les actions qui déclenchent le ralentissement.",
        tags: ['lenteur', 'lente', 'fige', 'bug', 'performance', 'problème'],
      },
    ],
  },
];

export const allFaqItems: FaqItem[] = faqCategories.flatMap((c) => c.items);

export function searchFaq(query: string): FaqItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return allFaqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q)),
  );
}
