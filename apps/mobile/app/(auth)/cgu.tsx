import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors, spacing, radius } from '../../src/theme';

const LAST_UPDATE = '3 juin 2026';

const articles = [
  {
    title: 'Article 1 – Éditeur',
    content:
      "L'application Fanafodiko est éditée à titre personnel par Andritiana Steve Rakotonimanana. Contact : pro@andritiana.tech",
  },
  {
    title: 'Article 2 – Objet',
    content:
      "Fanafodiko est une application gratuite destinée aux patients, à leurs aidants et aux professionnels de santé. Elle offre les fonctionnalités suivantes :\n\n• Suivi médicaments : planification des prises, rappels (push, email, in-app) et historique des traitements pour un ou plusieurs profils au sein d'un même foyer.\n\n• Réseau de pharmacies : consultation des pharmacies géolocalisées, de leurs horaires d'ouverture, de leurs gardes et de leurs coordonnées.\n\n• Recherche de médicaments (MedSearch) : localisation des médicaments disponibles dans les pharmacies proches selon un rayon de proximité choisi par l'utilisateur.\n\n• Gestion de pharmacie : pour les membres du réseau (staff, administrateurs), gestion des informations de l'établissement, des horaires exceptionnels et des réponses aux demandes de médicaments.",
  },
  {
    title: 'Article 3 – Accès et inscription',
    content:
      "L'accès à l'Application est entièrement gratuit. La création d'un compte requiert la fourniture d'informations exactes (adresse email). L'utilisateur est seul responsable de la confidentialité de ses identifiants et de toute activité réalisée depuis son compte.\n\nLes utilisateurs souhaitant gérer une pharmacie peuvent soumettre une demande d'affiliation soumise à validation par l'éditeur. L'attribution d'un rôle (staff, administrateur, superadmin) relève de la décision de l'administrateur de la pharmacie concernée.",
  },
  {
    title: 'Article 4 – Données personnelles',
    content:
      "Les données collectées incluent :\n• Compte : adresse email, mot de passe (stocké sous forme hashée, jamais en clair)\n• Profils du foyer : prénom, nom, date de naissance des personnes suivies\n• Médicaments : nom, dosage, fréquence, horaires de prise, historique de prise\n• Localisation : position approximative utilisée lors des recherches MedSearch ou de pharmacies proches — non stockée de façon permanente\n• Notifications : tokens d'appareils mobiles pour l'envoi de notifications push\n• Pharmacie : pour les membres du réseau, données de l'établissement et rôles attribués\n• Signalements : description et informations techniques (OS, taille écran) lors de signalements de bugs\n\nCes données sont utilisées exclusivement pour le fonctionnement du service. Aucune donnée personnelle identifiable n'est vendue ni cédée à des tiers à des fins commerciales.\n\nL'utilisateur dispose d'un droit d'accès, de rectification et de suppression de ses données en contactant : pro@andritiana.tech",
  },
  {
    title: 'Article 5 – Avertissement médical',
    content:
      "Fanafodiko est un outil d'aide à la gestion des médicaments et ne constitue pas un dispositif médical certifié. L'Application ne remplace en aucun cas l'avis, le diagnostic ou le suivi d'un professionnel de santé. En cas de doute sur un traitement, consultez toujours un médecin ou un pharmacien.",
  },
  {
    title: 'Article 6 – Responsabilité',
    content:
      "L'éditeur s'efforce d'assurer la disponibilité et la fiabilité de l'Application mais ne peut garantir un fonctionnement sans interruption.\n\nLes informations relatives aux pharmacies (horaires, disponibilité de médicaments, coordonnées) sont renseignées par les membres du réseau et peuvent ne pas refléter la situation en temps réel. L'éditeur ne peut être tenu responsable de l'inexactitude de ces informations.\n\nL'éditeur ne saurait être tenu responsable de dommages directs ou indirects résultant d'une utilisation incorrecte de l'Application ou de données inexactes transmises par des tiers.",
  },
  {
    title: 'Article 7 – Propriété intellectuelle',
    content:
      "L'ensemble des contenus de l'Application (textes, logos, interface, code source) est la propriété exclusive de l'éditeur. Toute reproduction, modification ou diffusion sans autorisation préalable est interdite.",
  },
  {
    title: 'Article 8 – Modification des CGU',
    content:
      "L'éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications par email ou notification. La poursuite de l'utilisation après modification vaut acceptation des nouvelles conditions.",
  },
  {
    title: 'Article 9 – Droit applicable',
    content:
      "Les présentes CGU sont soumises aux lois du pays de résidence de l'éditeur. En cas de litige, les parties s'engagent à rechercher une résolution amiable avant tout recours judiciaire.",
  },
  {
    title: 'Article 10 – Contact',
    content: 'Pour toute question relative aux présentes CGU : pro@andritiana.tech',
  },
];

export default function CguScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CGU</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Conditions Générales d'Utilisation</Text>
        <Text style={styles.lastUpdate}>Dernière mise à jour : {LAST_UPDATE}</Text>

        {articles.map((article) => (
          <View key={article.title} style={styles.article}>
            <Text style={styles.articleTitle}>{article.title}</Text>
            <Text style={styles.articleContent}>{article.content}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          © {new Date().getFullYear()} Fanafodiko – Andritiana Steve Rakotonimanana
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border ?? '#e5e7eb',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'FunnelDisplay_700Bold',
    fontSize: 16,
    color: colors.text,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  pageTitle: {
    fontFamily: 'FunnelDisplay_800ExtraBold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 4,
  },
  lastUpdate: {
    fontFamily: 'FunnelDisplay_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  article: {
    marginBottom: spacing.lg,
  },
  articleTitle: {
    fontFamily: 'FunnelDisplay_700Bold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 6,
  },
  articleContent: {
    fontFamily: 'FunnelDisplay_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    fontFamily: 'FunnelDisplay_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
