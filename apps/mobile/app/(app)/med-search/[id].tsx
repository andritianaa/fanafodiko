import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, CheckCircle, XCircle, MapPin, RefreshCw } from 'lucide-react-native';
import { medSearchApi } from '../../../src/api/client';
import { useStore, selectAppState } from '../../../src/store/useStore';
import { colors, spacing, radius, shadows } from '../../../src/theme';
import type { MedSearch, MedSearchResponse } from '../../../src/types';

function ResponseCard({ r }: { r: MedSearchResponse }) {
  const formatTime = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[resp.card, r.hasStock ? resp.cardOk : resp.cardNok]}>
      <View style={resp.left}>
        {r.hasStock
          ? <CheckCircle size={20} color={colors.success} />
          : <XCircle size={20} color={colors.error} />
        }
      </View>
      <View style={resp.content}>
        <Text style={resp.pharmacy}>{r.pharmacyName}</Text>
        {r.note && <Text style={resp.note}>{r.note}</Text>}
        <View style={resp.meta}>
          {r.distance != null && (
            <View style={resp.metaItem}>
              <MapPin size={11} color={colors.textMuted} />
              <Text style={resp.metaText}>{r.distance.toFixed(1)} km</Text>
            </View>
          )}
          {r.respondedAt && (
            <View style={resp.metaItem}>
              <Clock size={11} color={colors.textMuted} />
              <Text style={resp.metaText}>{formatTime(r.respondedAt)}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={[resp.badge, r.hasStock ? resp.badgeOk : resp.badgeNok]}>
        <Text style={[resp.badgeText, r.hasStock ? { color: colors.success } : { color: colors.error }]}>
          {r.hasStock ? 'Disponible' : 'Indisponible'}
        </Text>
      </View>
    </View>
  );
}

const resp = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    ...shadows.sm,
  },
  cardOk: { backgroundColor: colors.successLight, borderColor: '#bbf7d0' },
  cardNok: { backgroundColor: colors.errorLight, borderColor: '#fecaca' },
  left: { paddingTop: 2 },
  content: { flex: 1, gap: 3 },
  pharmacy: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: colors.text },
  note: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' },
  meta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: colors.textMuted },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, alignSelf: 'flex-start' },
  badgeOk: { backgroundColor: '#dcfce7' },
  badgeNok: { backgroundColor: '#fee2e2' },
  badgeText: { fontFamily: 'Nunito_700Bold', fontSize: 11 },
});

function ExpiresIn({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining('Expirée'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <View style={timer.row}>
      <Clock size={14} color={colors.textMuted} />
      <Text style={timer.text}>Expire dans : {remaining}</Text>
    </View>
  );
}

const timer = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: colors.textMuted },
});

export default function MedSearchResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const appState = useStore(selectAppState);

  const [search, setSearch] = useState<MedSearch | null>(null);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSearch = useCallback(async () => {
    try {
      const data = await medSearchApi.get(id);
      setSearch(data);
      if (data.status === 'closed') {
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    } catch {
      // Ignore polling errors
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!appState.isOnline) { setLoading(false); return; }
    fetchSearch();
    pollingRef.current = setInterval(fetchSearch, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchSearch, appState.isOnline]);

  if (!appState.isOnline) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Connexion requise</Text>
          <Text style={styles.emptyText}>Les résultats en temps réel nécessitent une connexion internet.</Text>
          <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/(app)/med-search/history')}>
            <Text style={styles.linkBtnText}>Voir l'historique</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      </SafeAreaView>
    );
  }

  if (!search) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Recherche introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isActive = search.status === 'active';
  const hasResponses = search.responses.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{search.medicationName}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusClosed]}>
              <Text style={[styles.statusText, isActive ? { color: colors.success } : { color: colors.textMuted }]}>
                {isActive ? 'En cours' : 'Terminée'}
              </Text>
            </View>
            <Text style={styles.radiusText}>Rayon : {search.radiusKm} km</Text>
          </View>
          {isActive && <ExpiresIn expiresAt={search.expiresAt} />}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{search.nearbyPharmacies.length}</Text>
            <Text style={styles.statLabel}>Pharmacies notifiées</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{search.responses.length}</Text>
            <Text style={styles.statLabel}>Réponses reçues</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {search.responses.filter((r) => r.hasStock).length}
            </Text>
            <Text style={styles.statLabel}>Disponible</Text>
          </View>
        </View>

        {/* Responses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Réponses des pharmacies</Text>
            {isActive && (
              <TouchableOpacity onPress={fetchSearch} style={styles.refreshBtn}>
                <RefreshCw size={15} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {!hasResponses ? (
            <View style={styles.waitingCard}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.waitingText}>En attente des réponses des pharmacies…</Text>
              <Text style={styles.waitingSubText}>
                {search.nearbyPharmacies.length} pharmacie{search.nearbyPharmacies.length !== 1 ? 's' : ''} notifiée{search.nearbyPharmacies.length !== 1 ? 's' : ''}
              </Text>
            </View>
          ) : (
            search.responses
              .slice()
              .sort((a, b) => {
                if (a.hasStock !== b.hasStock) return a.hasStock ? -1 : 1;
                return (a.distance ?? 99) - (b.distance ?? 99);
              })
              .map((r, i) => <ResponseCard key={`${r.pharmacyId}-${i}`} r={r} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerInfo: { flex: 1, gap: 4 },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusActive: { backgroundColor: colors.successLight },
  statusClosed: { backgroundColor: colors.divider },
  statusText: { fontFamily: 'Nunito_700Bold', fontSize: 12 },
  radiusText: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: colors.textMuted },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    ...shadows.sm,
  },
  statValue: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 24,
    color: colors.primary,
  },
  statLabel: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: { marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: colors.text,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  waitingText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  waitingSubText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: 12 },
  emptyTitle: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: colors.text },
  emptyText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  linkBtn: {
    backgroundColor: colors.primaryLighter,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  linkBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: colors.primary },
});
