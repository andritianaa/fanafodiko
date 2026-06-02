import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react-native';
import { medSearchApi } from '../../../src/api/client';
import { colors, spacing, radius, shadows } from '../../../src/theme';
import type { MedSearchHistoryItem } from '../../../src/types';
import { useFocusEffect } from 'expo-router';

function SearchHistoryCard({ item, onPress }: { item: MedSearchHistoryItem; onPress: () => void }) {
  const hasAvailable = item.responses.some((r) => r.hasStock);
  const isActive = item.status === 'active';
  const formatDate = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardLeft}>
        <View style={[styles.iconWrap, isActive ? styles.iconActive : styles.iconClosed]}>
          <Search size={18} color={isActive ? colors.primary : colors.textMuted} />
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.medName}>{item.medicationName}</Text>
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{item.nearbyPharmacies.length}</Text>
            <Text style={styles.statLbl}>notifiées</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{item.responses.length}</Text>
            <Text style={styles.statLbl}>réponses</Text>
          </View>
          {item.responses.length > 0 && (
            <View style={styles.stat}>
              {hasAvailable
                ? <CheckCircle size={14} color={colors.success} />
                : <XCircle size={14} color={colors.error} />
              }
              <Text style={[styles.statLbl, hasAvailable ? { color: colors.success } : { color: colors.error }]}>
                {hasAvailable ? 'Trouvé' : 'Indisponible'}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={[styles.statusDot, isActive ? styles.statusActive : styles.statusClosed]} />
      <ChevronRight size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function MedSearchHistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<MedSearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await medSearchApi.myHistory();
      setHistory(data.history);
    } catch {
      // Keep empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Historique des recherches</Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SearchHistoryCard
              item={item}
              onPress={() => router.push({ pathname: '/(app)/med-search/[id]', params: { id: item.id } })}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Clock size={44} color={colors.primaryLight} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>Aucune recherche</Text>
              <Text style={styles.emptyText}>
                Vos recherches de médicaments apparaîtront ici.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 22, color: colors.text },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 12,
    ...shadows.sm,
  },
  cardLeft: {},
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: { backgroundColor: colors.primaryLighter },
  iconClosed: { backgroundColor: colors.divider },
  cardContent: { flex: 1, gap: 3 },
  medName: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: colors.text },
  date: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: colors.textMuted },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 2 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statNum: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: colors.primary },
  statLbl: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: colors.textSecondary },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusActive: { backgroundColor: colors.success },
  statusClosed: { backgroundColor: colors.textMuted },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: spacing.xxl, gap: 12 },
  emptyTitle: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: colors.text },
  emptyText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
