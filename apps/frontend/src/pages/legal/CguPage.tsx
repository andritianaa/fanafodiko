import { Link } from "react-router-dom"

const LAST_UPDATE = "3 juin 2026"

const articles = [
  {
    title: "Article 1 – Éditeur",
    content: `L'application Fanafodiko (ci-après « l'Application ») est éditée à titre personnel par Andritiana Steve Rakotonimanana. Pour toute question : pro@andritiana.tech`,
  },
  {
    title: "Article 2 – Objet",
    content: `Fanafodiko est une application gratuite destinée aux patients, à leurs aidants et aux professionnels de santé. Elle offre les fonctionnalités suivantes :\n\n• Suivi médicaments : planification des prises, rappels (push, email, in-app) et historique des traitements pour un ou plusieurs profils au sein d'un même foyer.\n\n• Réseau de pharmacies : consultation des pharmacies géolocalisées, de leurs horaires d'ouverture, de leurs gardes et de leurs coordonnées.\n\n• Recherche de médicaments (MedSearch) : localisation des médicaments disponibles dans les pharmacies proches selon un rayon de proximité choisi par l'utilisateur.\n\n• Gestion de pharmacie : pour les membres du réseau (staff, administrateurs), gestion des informations de l'établissement, des horaires exceptionnels et des réponses aux demandes de médicaments.`,
  },
  {
    title: "Article 3 – Accès et inscription",
    content: `L'accès à l'Application est entièrement gratuit. La création d'un compte requiert la fourniture d'informations exactes (adresse email). L'utilisateur est seul responsable de la confidentialité de ses identifiants de connexion et de toute activité réalisée depuis son compte.\n\nLes utilisateurs souhaitant gérer une pharmacie peuvent soumettre une demande d'affiliation soumise à validation par l'éditeur. L'attribution d'un rôle (staff, administrateur, superadmin) relève de la décision de l'administrateur de la pharmacie concernée.`,
  },
  {
    title: "Article 4 – Données personnelles",
    content: `Les données collectées incluent :\n• Compte : adresse email, mot de passe (stocké sous forme hashée, jamais en clair)\n• Profils du foyer : prénom, nom, date de naissance des personnes suivies\n• Médicaments : nom, dosage, fréquence, horaires de prise, historique de prise\n• Localisation : position approximative utilisée lors des recherches MedSearch ou de pharmacies proches — non stockée de façon permanente\n• Notifications : tokens d'appareils mobiles pour l'envoi de notifications push\n• Pharmacie : pour les membres du réseau, données de l'établissement et rôles attribués\n• Signalements : description et informations techniques (OS, taille écran) lors de signalements de bugs\n\nCes données sont utilisées exclusivement pour le fonctionnement du service. Des données anonymisées peuvent être utilisées pour améliorer l'Application. Aucune donnée personnelle identifiable n'est vendue ni cédée à des tiers à des fins commerciales.\n\nConformément aux réglementations applicables, l'utilisateur dispose d'un droit d'accès, de rectification et de suppression de ses données en contactant : pro@andritiana.tech`,
  },
  {
    title: "Article 5 – Avertissement médical",
    content: `Fanafodiko est un outil d'aide à la gestion des médicaments et ne constitue pas un dispositif médical certifié. L'Application ne remplace en aucun cas l'avis, le diagnostic ou le suivi d'un professionnel de santé. En cas de doute sur un traitement, consultez toujours un médecin ou un pharmacien.`,
  },
  {
    title: "Article 6 – Responsabilité",
    content: `L'éditeur s'efforce d'assurer la disponibilité et la fiabilité de l'Application mais ne peut garantir un fonctionnement sans interruption.\n\nLes informations relatives aux pharmacies (horaires, disponibilité de médicaments, coordonnées) sont renseignées par les membres du réseau et peuvent ne pas refléter la situation en temps réel. L'éditeur ne peut être tenu responsable de l'inexactitude de ces informations.\n\nL'éditeur ne saurait être tenu responsable de dommages directs ou indirects résultant d'une utilisation incorrecte de l'Application ou de données inexactes transmises par des tiers.`,
  },
  {
    title: "Article 7 – Propriété intellectuelle",
    content: `L'ensemble des contenus de l'Application (textes, logos, interface, code source) est la propriété exclusive de l'éditeur. Toute reproduction, modification ou diffusion sans autorisation préalable est interdite.`,
  },
  {
    title: "Article 8 – Modification des CGU",
    content: `L'éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications par email ou notification dans l'Application. La poursuite de l'utilisation après modification vaut acceptation des nouvelles conditions.`,
  },
  {
    title: "Article 9 – Droit applicable",
    content: `Les présentes CGU sont soumises aux lois du pays de résidence de l'éditeur. En cas de litige, les parties s'engagent à rechercher une résolution amiable avant tout recours judiciaire.`,
  },
  {
    title: "Article 10 – Contact",
    content: `Pour toute question relative aux présentes CGU : pro@andritiana.tech`,
  },
]

export default function CguPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link to="/register" className="text-sm text-gray-500 hover:underline">
            ← Retour
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo.png" alt="Fanafodiko" className="w-10 h-10 rounded-xl" />
            <h1 className="text-2xl font-bold text-gray-900">Conditions Générales d'Utilisation</h1>
          </div>
          <p className="text-sm text-gray-400 mb-8">Dernière mise à jour : {LAST_UPDATE}</p>

          <div className="space-y-4">
            {articles.map((article) => (
              <section key={article.title}>
                <h2 className="text-base font-semibold text-gray-800 mb-2">{article.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{article.content}</p>
              </section>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Fanafodiko – Andritiana Steve Rakotonimanana
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
