import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Clock, WifiOff, Pill, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useStore, selectAppState } from '../../../src/store/useStore';
import { medSearchApi } from '../../../src/api/client';
import { SyncBanner } from '../../../components/SyncBanner';
import { colors, spacing, radius, shadows } from '../../../src/theme';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { MedSearchHistoryItem } from '../../../src/types';

const RADIUS_OPTIONS = [1, 2, 5, 10, 20];

export default function MedSearchScreen() {
  const router = useRouter();
  const appState = useStore(selectAppState);

  const [medicationName, setMedicationName] = useState('');
  const [selectedRadius, setSelectedRadius] = useState(5);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentHistory, setRecentHistory] = useState<MedSearchHistoryItem[]>([]);

  useEffect(() => {
    medSearchApi.myHistory()
      .then((res) => setRecentHistory((res.data?.history ?? []).slice(0, 5)))
      .catch(() => {});
  }, []);

  const isOffline = !appState.isOnline;
  const canSubmit = medicationName.trim().length > 0 && !loading && !isOffline;

  const handleSearch = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      // Géolocalisation, on utilise une position par défaut si l'API n'est pas disponible
      let lat = -18.9137;
      let lng = 47.5361;

      try {
        // expo-location doit être installé pour la géolocalisation réelle
        const Location = await import('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        }
      } catch {
        // Pas de géolocalisation disponible
      }

      const result = await medSearchApi.create({
        medicationName: medicationName.trim(),
        coordinates: { lat, lng },
        radiusKm: selectedRadius,
        note: note.trim() || undefined,
      });

      router.push({ pathname: '/(app)/med-search/[id]', params: { id: result.id } });
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de lancer la recherche. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Recherche</Text>
        <Text style={styles.subtitle}>
          Trouvez un médicament dans les pharmacies proches
        </Text>
      </View>

      <SyncBanner />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {isOffline ? (
          <View style={styles.offlineCard}>
            <WifiOff size={32} color={colors.warning} strokeWidth={1.5} />
            <Text style={styles.offlineTitle}>Connexion requise</Text>
            <Text style={styles.offlineText}>
              La recherche de médicaments nécessite une connexion internet active.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Médicament</Text>
              <View style={styles.inputWrap}>
                <Search size={16} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={medicationName}
                  onChangeText={setMedicationName}
                  placeholder="Nom du médicament…"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="sentences"
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Rayon de recherche</Text>
              <View style={styles.radiusRow}>
                {RADIUS_OPTIONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.radiusPill, selectedRadius === r && styles.radiusPillActive]}
                    onPress={() => setSelectedRadius(r)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.radiusText, selectedRadius === r && styles.radiusTextActive]}>
                      {r} km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Note (optionnel)</Text>
              <TextInput
                style={[styles.input, styles.noteInput]}
                value={note}
                onChangeText={setNote}
                placeholder="Dosage, forme galénique, urgence…"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.infoCard}>
              <MapPin size={14} color={colors.primary} />
              <Text style={styles.infoText}>
                Les pharmacies dans un rayon de {selectedRadius} km recevront une notification immédiate.
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Clock size={14} color={colors.textMuted} />
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                La recherche expire automatiquement après 2 heures.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              onPress={handleSearch}
              disabled={!canSubmit}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Search size={18} color="#FFF" />
                  <Text style={styles.submitBtnText}>Lancer la recherche</Text>
                </>
              )}
            </TouchableOpacity>

            {/* ── Recherches récentes ── */}
            {recentHistory.length > 0 && (
              <View style={styles.historySection}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>Recherches récentes</Text>
                  <TouchableOpacity
                    style={styles.seeAllBtn}
                    onPress={() => router.push('/(app)/med-search/history')}
                  >
                    <Text style={styles.seeAllText}>Voir toutes</Text>
                    <ArrowRight size={12} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.historyList}>
                  {recentHistory.map((item, idx) => (
                    <RecentSearchRow
                      key={item.id}
                      item={item}
                      isLast={idx === recentHistory.length - 1}
                      onPress={() => router.push({ pathname: '/(app)/med-search/[id]', params: { id: item.id } })}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Composant ligne recherche récente ────────────────────────────────────────

function RecentSearchRow({
  item,
  isLast,
  onPress,
}: {
  item: MedSearchHistoryItem;
  isLast: boolean;
  onPress: () => void;
}) {
  const isActive = item.status === 'active' && new Date(item.expiresAt) > new Date();
  const hasAvailable = item.responses.some((r) => r.hasStock);
  const hasResponded = item.responses.length > 0;

  const badge = isActive
    ? { label: 'En cours', color: colors.primary, bg: colors.primaryLighter }
    : hasAvailable
    ? { label: 'Disponible', color: '#16a34a', bg: '#dcfce7' }
    : hasResponded
    ? { label: 'Non trouvé', color: '#dc2626', bg: '#fee2e2' }
    : { label: 'Expiré', color: colors.textMuted, bg: colors.border };

  return (
    <TouchableOpacity
      style={[styles.recentItem, !isLast && styles.recentItemBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.recentIcon}>
        <Pill size={14} color={colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.recentName} numberOfLines={1}>{item.medicationName}</Text>
        {item.createdAt && (
          <Text style={styles.recentDate}>
            {format(new Date(item.createdAt), 'd MMM · HH:mm', { locale: fr })}
          </Text>
        )}
      </View>
      <View style={[styles.recentBadge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.recentBadgeText, { color: badge.color }]}>{badge.label}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 26, color: colors.text },
  subtitle: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  fieldLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: colors.text,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: colors.text,
    padding: 0,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.background,
    minHeight: 80,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: colors.text,
    flex: undefined,
  },
  radiusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  radiusPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  radiusPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radiusText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
  },
  radiusTextActive: { color: '#FFF' },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.primaryLighter,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 15,
    ...shadows.md,
  },
  submitBtnDisabled: {
    opacity: 0.55,
  },
  submitBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#FFF',
  },
  offlineCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  offlineTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: colors.text },
  offlineText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  historySection: { gap: spacing.sm },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTitle: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: colors.textSecondary },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seeAllText: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: colors.primary },
  historyList: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  recentItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  recentIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentName: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: colors.text },
  recentDate: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: colors.textMuted, marginTop: 1 },
  recentBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.full },
  recentBadgeText: { fontFamily: 'Nunito_700Bold', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
});
