import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft, Clock, Calendar, Users, Building2,
  Search, ChevronRight, WifiOff,
} from 'lucide-react-native';
import { myPharmacyApi, medSearchApi } from '../../../src/api/client';
import { useStore, selectMyPharmacies, selectAppState } from '../../../src/store/useStore';
import { SyncBanner } from '../../../components/SyncBanner';
import { colors, spacing, radius, shadows } from '../../../src/theme';
import type { Pharmacy, PendingSearch } from '../../../src/types';

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function PendingSearchCard({
  search,
  onRespond,
  isOffline,
}: {
  search: PendingSearch;
  onRespond: (hasStock: boolean) => void;
  isOffline: boolean;
}) {
  const formatDate = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={pending.card}>
      <View style={pending.header}>
        <Search size={16} color={colors.primary} />
        <Text style={pending.med}>{search.medicationName}</Text>
        <Text style={pending.radius}>{search.radiusKm} km</Text>
      </View>
      {search.note && <Text style={pending.note}>{search.note}</Text>}
      <Text style={pending.date}>{formatDate(search.createdAt)}</Text>
      {isOffline ? (
        <View style={pending.offline}>
          <WifiOff size={12} color={colors.warning} />
          <Text style={pending.offlineText}>Connexion requise pour répondre</Text>
        </View>
      ) : (
        <View style={pending.actions}>
          <TouchableOpacity
            style={[pending.btn, pending.btnOk]}
            onPress={() => onRespond(true)}
          >
            <Text style={[pending.btnText, { color: colors.success }]}>Disponible</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[pending.btn, pending.btnNok]}
            onPress={() => onRespond(false)}
          >
            <Text style={[pending.btnText, { color: colors.error }]}>Indisponible</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const pending = StyleSheet.create({
  card: {
    backgroundColor: colors.primaryLighter,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  med: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: colors.text, flex: 1 },
  radius: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: colors.primary },
  note: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: colors.textSecondary, fontStyle: 'italic' },
  date: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  btn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  btnOk: { backgroundColor: colors.successLight, borderColor: '#86efac' },
  btnNok: { backgroundColor: colors.errorLight, borderColor: '#fca5a5' },
  btnText: { fontFamily: 'Nunito_700Bold', fontSize: 13 },
  offline: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4 },
  offlineText: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: colors.warning },
});

export default function MyPharmacyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const appState = useStore(selectAppState);
  const myPharmacies = useStore(selectMyPharmacies);

  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(
    myPharmacies.find((p) => p.id === id) ?? null,
  );
  const [pendingSearches, setPendingSearches] = useState<PendingSearch[]>([]);
  const [loading, setLoading] = useState(!pharmacy);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!appState.isOnline) return;
    if (isRefresh) setRefreshing(true);
    else if (!pharmacy) setLoading(true);

    try {
      const [phData, searchData] = await Promise.allSettled([
        myPharmacyApi.get(id),
        medSearchApi.pharmacyPending(id),
      ]);
      if (phData.status === 'fulfilled') setPharmacy(phData.value);
      if (searchData.status === 'fulfilled') setPendingSearches(searchData.value);
    } catch {}

    setLoading(false);
    setRefreshing(false);
  }, [id, appState.isOnline, pharmacy]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRespond = async (search: PendingSearch, hasStock: boolean) => {
    if (!appState.isOnline) {
      Alert.alert('Hors ligne', 'Connexion requise pour répondre.');
      return;
    }
    try {
      await medSearchApi.respond(search.searchId, id, { hasStock });
      setPendingSearches((prev) => prev.filter((s) => s.searchId !== search.searchId));
    } catch {
      Alert.alert('Erreur', 'Impossible de soumettre la réponse.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.loader}><ActivityIndicator color={colors.primary} size="large" /></View>
      </SafeAreaView>
    );
  }

  if (!pharmacy) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.loader}><Text style={styles.errorText}>Pharmacie introuvable</Text></View>
      </SafeAreaView>
    );
  }

  const todayHour = pharmacy.openingHours[new Date().getDay()];
  const isOpenNow = pharmacy.isOpen24h || pharmacy.isOpenNow;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={2}>{pharmacy.name}</Text>
          <View style={[styles.statusBadge, isOpenNow ? styles.statusOpen : styles.statusClosed]}>
            <Text style={[styles.statusText, isOpenNow ? { color: colors.success } : { color: colors.error }]}>
              {pharmacy.isOpen24h ? '24h/24' : isOpenNow ? 'Ouvert' : 'Fermé'}
            </Text>
          </View>
        </View>
      </View>

      <SyncBanner />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Demandes en attente */}
        {pendingSearches.length > 0 && (
          <Section title={`Demandes en attente (${pendingSearches.length})`}>
            {pendingSearches.map((s) => (
              <PendingSearchCard
                key={s.searchId}
                search={s}
                isOffline={!appState.isOnline}
                onRespond={(hasStock) => handleRespond(s, hasStock)}
              />
            ))}
          </Section>
        )}

        {/* Vue d'ensemble */}
        <Section title="Aujourd'hui">
          <View style={styles.infoRow}>
            <Clock size={15} color={colors.primary} />
            <Text style={styles.infoText}>
              {todayHour
                ? todayHour.isClosed
                  ? "Fermé aujourd'hui"
                  : `${todayHour.open} – ${todayHour.close}`
                : pharmacy.isOpen24h ? 'Ouvert 24h/24' : 'Horaires non définis'
              }
            </Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 4 }]}>
            <Building2 size={15} color={colors.textMuted} />
            <Text style={styles.infoText}>{pharmacy.address}, {pharmacy.city}</Text>
          </View>
        </Section>

        {/* Horaires */}
        {pharmacy.openingHours.length > 0 && (
          <Section title="Horaires hebdomadaires">
            {pharmacy.openingHours
              .slice()
              .sort((a, b) => a.day - b.day)
              .map((h) => (
                <View key={h.day} style={styles.hoursRow}>
                  <Text style={styles.hoursDay}>{DAY_NAMES[h.day]}</Text>
                  <Text style={h.isClosed ? styles.hoursClosed : styles.hoursTime}>
                    {h.isClosed ? 'Fermé' : `${h.open} – ${h.close}`}
                  </Text>
                </View>
              ))}
          </Section>
        )}

        {/* Calendrier gardes + exceptions */}
        {(pharmacy.pharmacyGuards.length > 0 || pharmacy.exceptionalSchedules.length > 0) && (
          <Section title="Calendrier">
            {pharmacy.pharmacyGuards.filter((g) => g.isActive).map((g) => (
              <View key={g.id} style={styles.calRow}>
                <View style={[styles.calBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.calBadgeText, { color: colors.primary }]}>Garde</Text>
                </View>
                <Text style={styles.calDates}>{g.startDate} → {g.endDate}</Text>
              </View>
            ))}
            {pharmacy.exceptionalSchedules
              .filter((e) => e.endDate >= new Date().toISOString().split('T')[0])
              .slice(0, 5)
              .map((e) => (
                <View key={e.id} style={styles.calRow}>
                  <View style={[styles.calBadge, { backgroundColor: e.type === 'opening' ? colors.successLight : colors.errorLight }]}>
                    <Text style={[styles.calBadgeText, { color: e.type === 'opening' ? colors.success : colors.error }]}>
                      {e.type === 'opening' ? 'Ouverture' : 'Fermeture'}
                    </Text>
                  </View>
                  <Text style={styles.calDates}>{e.startDate} → {e.endDate}</Text>
                </View>
              ))}
          </Section>
        )}

        {!appState.isOnline && (
          <View style={styles.offlineNote}>
            <WifiOff size={14} color={colors.warning} />
            <Text style={styles.offlineNoteText}>
              Mode hors ligne, les modifications nécessitent une connexion.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md, gap: spacing.sm },
  backBtn: {
    width: 40, height: 40, borderRadius: radius.sm,
    backgroundColor: colors.primaryLighter, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  headerInfo: { flex: 1, gap: 6 },
  name: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, alignSelf: 'flex-start' },
  statusOpen: { backgroundColor: colors.successLight },
  statusClosed: { backgroundColor: colors.errorLight },
  statusText: { fontFamily: 'Nunito_700Bold', fontSize: 12 },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold', fontSize: 13, color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadows.sm,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoText: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: colors.text, flex: 1 },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  hoursDay: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: colors.text, width: 100 },
  hoursTime: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: colors.text },
  hoursClosed: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: colors.textMuted },
  calRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  calBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  calBadgeText: { fontFamily: 'Nunito_700Bold', fontSize: 11 },
  calDates: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: colors.text },
  offlineNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: colors.warningLight, borderRadius: radius.md, padding: spacing.md,
  },
  offlineNoteText: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: colors.warning, flex: 1, lineHeight: 18,
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontFamily: 'Nunito_400Regular', fontSize: 16, color: colors.textSecondary },
});
