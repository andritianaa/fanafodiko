import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Plus, Pill, X, Calendar } from 'lucide-react-native';
import { useStore } from '../../../src/store/useStore';
import { medicationsApi, householdsApi, ApiError } from '../../../src/api/client';
import {
  upsertMedications,
  deleteMedication,
  updateMedicationStatus,
  enqueueAction,
} from '../../../src/db/database';
import { scheduleAllNotifications } from '../../../src/notifications/scheduler';
import { MedicationCard } from '../../../components/MedicationCard';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { colors, spacing, radius, shadows } from '../../../src/theme';
import type { Medication, Frequency, FrequencyType } from '../../../src/types';

const FREQ_TYPES: FrequencyType[] = ['DAILY', 'WEEKLY', 'INTERVAL'];
const FREQ_LABELS: Record<FrequencyType, string> = {
  DAILY: 'Quotidien',
  WEEKLY: 'Hebdomadaire',
  INTERVAL: 'Intervalle',
};
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Lun', TUESDAY: 'Mar', WEDNESDAY: 'Mer', THURSDAY: 'Jeu',
  FRIDAY: 'Ven', SATURDAY: 'Sam', SUNDAY: 'Dim',
};

function MedModal({
  visible,
  onClose,
  profileId,
  editMed,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  profileId: string;
  editMed?: Medication;
  onSaved: (m: Medication) => void;
}) {
  const isEdit = !!editMed;
  const [form, setForm] = useState({
    name: editMed?.name ?? '',
    dosage: editMed?.dosage ?? '',
    freqType: editMed?.frequency.type ?? 'DAILY' as FrequencyType,
    times: editMed?.frequency.times.join(', ') ?? '08:00',
    days: editMed?.frequency.days ?? [] as string[],
    startDate: editMed?.startDate.split('T')[0] ?? new Date().toISOString().split('T')[0],
    endDate: editMed?.endDate?.split('T')[0] ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const appState = useStore((s) => s.appState);
  const upsertMed = useStore((s) => s.upsertMedication);

  const update = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleDay = (day: string) => {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Nom requis';
    if (!form.dosage.trim()) e.dosage = 'Dosage requis';
    const times = form.times.split(',').map((t) => t.trim()).filter(Boolean);
    if (!times.length) e.times = 'Au moins un horaire requis';
    const timeRx = /^([01]?\d|2[0-3]):[0-5]\d$/;
    if (times.some((t) => !timeRx.test(t))) e.times = 'Format HH:MM invalide';
    if (form.freqType === 'WEEKLY' && form.days.length === 0)
      e.days = 'Sélectionnez au moins un jour';
    if (!form.startDate) e.startDate = 'Date de début requise';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const getFrequency = (): Frequency => ({
    type: form.freqType,
    times: form.times.split(',').map((t) => t.trim()).filter(Boolean),
    days: form.freqType === 'WEEKLY' ? form.days : undefined,
  });

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      let saved: Medication;
      const payload = {
        profileId,
        name: form.name.trim(),
        dosage: form.dosage.trim(),
        frequency: getFrequency(),
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      };

      if (isEdit && editMed) {
        if (appState.isOnline) {
          saved = await medicationsApi.update(editMed.id, payload);
        } else {
          saved = { ...editMed, ...payload, updatedAt: new Date().toISOString() };
          await enqueueAction({ type: 'UPDATE_MEDICATION', id: editMed.id, data: payload });
        }
      } else {
        if (appState.isOnline) {
          saved = await medicationsApi.create(payload);
        } else {
          const tempId = `temp_med_${Date.now()}`;
          saved = { id: tempId, ...payload, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
          await enqueueAction({ type: 'CREATE_MEDICATION', data: { ...payload, isActive: true }, tempId });
        }
      }
      await upsertMedications([saved]);
      upsertMed(saved);
      scheduleAllNotifications().catch(() => {});
      onSaved(saved);
      onClose();
    } catch (err) {
      setErrors({ general: err instanceof ApiError ? err.message : 'Erreur' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <Pressable style={m.overlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={m.kav}>
          <Pressable style={m.sheet} onPress={() => {}}>
            <View style={m.handle} />
            <View style={m.header}>
              <Text style={m.title}>{isEdit ? 'Modifier' : 'Ajouter'} un médicament</Text>
              <TouchableOpacity onPress={onClose} style={m.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {errors.general && (
                <View style={m.errorBanner}><Text style={m.errorText}>{errors.general}</Text></View>
              )}
              <Input label="Nom du médicament" placeholder="Doliprane" value={form.name} onChangeText={update('name')} error={errors.name} required />
              <Input label="Dosage" placeholder="500mg" value={form.dosage} onChangeText={update('dosage')} error={errors.dosage} required />

              <Text style={m.label}>Fréquence <Text style={{ color: colors.error }}>*</Text></Text>
              <View style={m.chipRow}>
                {FREQ_TYPES.map((ft) => (
                  <TouchableOpacity
                    key={ft}
                    style={[m.chip, form.freqType === ft && m.chipActive]}
                    onPress={() => setForm((f) => ({ ...f, freqType: ft }))}
                  >
                    <Text style={[m.chipText, form.freqType === ft && m.chipTextActive]}>
                      {FREQ_LABELS[ft]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Horaires (HH:MM, séparés par des virgules)"
                placeholder="08:00, 20:00"
                value={form.times}
                onChangeText={update('times')}
                error={errors.times}
                required
              />

              {form.freqType === 'WEEKLY' && (
                <>
                  <Text style={m.label}>Jours <Text style={{ color: colors.error }}>*</Text></Text>
                  <View style={m.chipRow}>
                    {DAYS.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[m.chip, form.days.includes(day) && m.chipActive]}
                        onPress={() => toggleDay(day)}
                      >
                        <Text style={[m.chipText, form.days.includes(day) && m.chipTextActive]}>
                          {DAY_SHORT[day]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {errors.days && <Text style={m.errorText}>{errors.days}</Text>}
                </>
              )}

              <View style={m.row}>
                <Input
                  label="Date de début"
                  placeholder="2024-01-01"
                  value={form.startDate}
                  onChangeText={update('startDate')}
                  error={errors.startDate}
                  required
                  containerStyle={m.half}
                />
                <Input
                  label="Date de fin (optionnel)"
                  placeholder="2024-12-31"
                  value={form.endDate}
                  onChangeText={update('endDate')}
                  containerStyle={m.half}
                />
              </View>

              <Button
                label={isEdit ? 'Enregistrer les modifications' : 'Ajouter le médicament'}
                onPress={handleSave}
                loading={loading}
                fullWidth
                size="lg"
                style={{ marginTop: 8 }}
              />
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const profiles = useStore((s) => s.profiles);
  const medications = useStore((s) => s.medications);
  const upsertMed = useStore((s) => s.upsertMedication);
  const removeMed = useStore((s) => s.removeMedication);
  const appState = useStore((s) => s.appState);

  const profile = profiles.find((p) => p.id === id);
  const profileMeds = medications.filter((m) => m.profileId === id);

  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editMed, setEditMed] = useState<Medication | undefined>();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const meds = await medicationsApi.listByProfile(id);
      await upsertMedications(meds);
      meds.forEach((m) => upsertMed(m));
    } catch {}
    setRefreshing(false);
  }, [id]);

  const handleToggle = async (med: Medication) => {
    const newActive = !med.isActive;
    if (appState.isOnline) {
      try {
        await medicationsApi.toggleStatus(med.id, newActive);
      } catch {}
    } else {
      await enqueueAction({ type: 'TOGGLE_MEDICATION', id: med.id, isActive: newActive });
    }
    await updateMedicationStatus(med.id, newActive);
    upsertMed({ ...med, isActive: newActive });
    scheduleAllNotifications().catch(() => {});
  };

  const handleDelete = (med: Medication) => {
    Alert.alert(
      'Supprimer le médicament',
      `Supprimer "${med.name}" définitivement ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (appState.isOnline) {
              try { await medicationsApi.remove(med.id); } catch {}
            } else {
              await enqueueAction({ type: 'DELETE_MEDICATION', id: med.id });
            }
            await deleteMedication(med.id);
            removeMed(med.id);
            scheduleAllNotifications().catch(() => {});
          },
        },
      ]
    );
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ padding: 20, color: colors.textSecondary }}>Membre introuvable</Text>
      </SafeAreaView>
    );
  }

  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
  const activeMeds = profileMeds.filter((m) => m.isActive).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => { setEditMed(undefined); setShowAdd(true); }}>
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}
            colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{profile.firstName} {profile.lastName}</Text>
          <Text style={styles.profileRel}>{profile.relationship}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{profileMeds.length}</Text>
              <Text style={styles.statLabel}>médicaments</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{activeMeds}</Text>
              <Text style={styles.statLabel}>actifs</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Médicaments{profileMeds.length > 0 ? ` (${profileMeds.length})` : ''}
          </Text>

          {profileMeds.length === 0 ? (
            <View style={styles.empty}>
              <Pill size={40} color={colors.primaryLight} strokeWidth={1.5} />
              <Text style={styles.emptyText}>Aucun médicament — appuyez sur + pour en ajouter</Text>
            </View>
          ) : (
            profileMeds
              .slice()
              .sort((a, b) => Number(b.isActive) - Number(a.isActive))
              .map((med) => (
                <MedicationCard
                  key={med.id}
                  medication={med}
                  onPress={() => { setEditMed(med); setShowAdd(true); }}
                  onToggleStatus={() => handleToggle(med)}
                />
              ))
          )}
        </View>
      </ScrollView>

      <MedModal
        visible={showAdd}
        onClose={() => { setShowAdd(false); setEditMed(undefined); }}
        profileId={id}
        editMed={editMed}
        onSaved={(saved) => upsertMed(saved)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  fab: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.md,
  },
  profileCard: {
    margin: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  avatar: {
    width: 72, height: 72, borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  initials: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28, color: colors.primary,
  },
  profileName: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20, color: colors.text, marginBottom: 4,
  },
  profileRel: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14, color: colors.textSecondary,
    textTransform: 'capitalize', marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: colors.divider,
    paddingTop: spacing.md, width: '100%',
    justifyContent: 'center', gap: spacing.xl,
  },
  stat: { alignItems: 'center' },
  statNum: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 22, color: colors.primary,
  },
  statLabel: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12, color: colors.textSecondary,
  },
  statDiv: {
    width: 1, height: 32, backgroundColor: colors.divider,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 17, color: colors.text, marginBottom: spacing.sm,
  },
  empty: {
    alignItems: 'center', paddingVertical: spacing.xl, gap: 12,
  },
  emptyText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14, color: colors.textSecondary, textAlign: 'center',
  },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  kav: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, maxHeight: '92%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.lg,
  },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: colors.text },
  closeBtn: {
    width: 34, height: 34, borderRadius: radius.full,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
  },
  errorBanner: {
    backgroundColor: colors.errorLight, borderRadius: radius.sm, padding: 10, marginBottom: 12,
  },
  errorText: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: colors.error },
  label: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.primary },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
});
