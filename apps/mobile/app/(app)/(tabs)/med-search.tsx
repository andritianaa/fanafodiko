import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Clock, History, WifiOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useStore, selectAppState } from '../../../src/store/useStore';
import { medSearchApi } from '../../../src/api/client';
import { SyncBanner } from '../../../components/SyncBanner';
import { colors, spacing, radius, shadows } from '../../../src/theme';

const RADIUS_OPTIONS = [1, 2, 5, 10, 20];

export default function MedSearchScreen() {
  const router = useRouter();
  const appState = useStore(selectAppState);

  const [medicationName, setMedicationName] = useState('');
  const [selectedRadius, setSelectedRadius] = useState(5);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const isOffline = !appState.isOnline;
  const canSubmit = medicationName.trim().length > 0 && !loading && !isOffline;

  const handleSearch = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      // Géolocalisation — on utilise une position par défaut si l'API n'est pas disponible
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
        <View style={styles.headerTop}>
          <Text style={styles.title}>Recherche</Text>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => router.push('/(app)/med-search/history')}
          >
            <History size={18} color={colors.primary} />
            <Text style={styles.historyBtnText}>Historique</Text>
          </TouchableOpacity>
        </View>
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 26, color: colors.text },
  subtitle: { fontFamily: 'Nunito_400Regular', fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  historyBtnText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: colors.primary },
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
});
