import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Building2, MapPin, ChevronRight } from 'lucide-react-native';
import { useStore, selectMyPharmacies, selectAppState } from '../../../src/store/useStore';
import { myPharmacyApi } from '../../../src/api/client';
import { SyncBanner } from '../../../components/SyncBanner';
import { PendingSearchModal } from '../../../components/PendingSearchModal';
import { usePendingSearches } from '../../../src/hooks/usePendingSearches';
import { colors, spacing, radius, shadows } from '../../../src/theme';
import type { Pharmacy } from '../../../src/types';

function PharmacyRow({ pharmacy, onPress }: { pharmacy: Pharmacy; onPress: () => void }) {
  const isOpenNow = pharmacy.isOpenNow || pharmacy.isOpen24h;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardIcon}>
        <Building2 size={20} color={colors.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardName}>{pharmacy.name}</Text>
        <View style={styles.cardMeta}>
          <MapPin size={12} color={colors.textMuted} />
          <Text style={styles.cardCity} numberOfLines={1}>{pharmacy.city}</Text>
        </View>
      </View>
      <View style={[styles.statusDot, isOpenNow ? styles.dotOpen : styles.dotClosed]} />
      <ChevronRight size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function MyPharmacyScreen() {
  const router = useRouter();
  const myPharmacies = useStore(selectMyPharmacies);
  const appState = useStore(selectAppState);
  const setMyPharmacies = useStore((s) => s.setMyPharmacies);
  const [refreshing, setRefreshing] = useState(false);

  const { entries, modalVisible, closeModal, respond } = usePendingSearches(myPharmacies);

  const handleRefresh = useCallback(async () => {
    if (!appState.isOnline) return;
    setRefreshing(true);
    try {
      const data = await myPharmacyApi.list();
      setMyPharmacies(data);
    } catch {}
    setRefreshing(false);
  }, [appState.isOnline, setMyPharmacies]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Ma Pharmacie</Text>
          {entries.length > 0 && (
            <TouchableOpacity
              style={styles.alertChip}
              onPress={() => closeModal()}
              activeOpacity={0.8}
            >
              <View style={styles.alertDot} />
              <Text style={styles.alertChipText}>
                {entries.length} demande{entries.length > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.subtitle}>
          {myPharmacies.length} pharmacie{myPharmacies.length !== 1 ? 's' : ''} gérée{myPharmacies.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <SyncBanner />

      <FlatList
        data={myPharmacies}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <PharmacyRow
            pharmacy={item}
            onPress={() =>
              router.push({ pathname: '/(app)/my-pharmacy/[id]', params: { id: item.id } })
            }
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Building2 size={44} color={colors.primaryLight} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Aucune pharmacie</Text>
            <Text style={styles.emptyText}>
              Vous n'êtes membre d'aucune pharmacie pour l'instant.
            </Text>
          </View>
        }
      />

      <PendingSearchModal
        visible={modalVisible}
        entries={entries}
        onRespond={respond}
        onDismiss={closeModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 26, color: colors.text },
  subtitle: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: colors.textSecondary },
  alertChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.errorLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  alertDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  alertChipText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    color: colors.error,
  },
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
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1, gap: 3 },
  cardName: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: colors.text },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardCity: { fontFamily: 'Nunito_400Regular', fontSize: 12, color: colors.textMuted, flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  dotOpen: { backgroundColor: colors.success },
  dotClosed: { backgroundColor: colors.error },
  empty: { alignItems: 'center', paddingTop: spacing.xxl, gap: 12 },
  emptyTitle: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: colors.text },
  emptyText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
