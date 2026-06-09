import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Users, X } from 'lucide-react-native';
import { useStore, selectProfiles, selectMedications } from '../../../src/store/useStore';
import { householdsApi, ApiError } from '../../../src/api/client';
import { insertProfile, enqueueAction } from '../../../src/db/database';
import { fullSync } from '../../../src/sync/syncService';
import { MemberCard } from '../../../components/MemberCard';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { colors, spacing, radius, shadows } from '../../../src/theme';
import type { Profile } from '../../../src/types';

const RELATIONSHIPS = ['moi', 'conjoint', 'enfant', 'parent', 'autre'];

function AddMemberModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: (p: Profile) => void;
}) {
  const [form, setForm] = useState({ firstName: '', lastName: '', dateOfBirth: '', relationship: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const appState = useStore((s) => s.appState);
  const upsertProfile = useStore((s) => s.upsertProfile);

  const update = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Prénom requis';
    if (!form.lastName.trim()) e.lastName = 'Nom requis';
    if (!form.dateOfBirth.trim()) e.dateOfBirth = 'Date requise';
    if (!form.relationship) e.relationship = 'Relation requise';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      let profile: Profile;
      if (appState.isOnline) {
        profile = await householdsApi.create({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          dateOfBirth: form.dateOfBirth.trim(),
          relationship: form.relationship,
        });
      } else {
        const tempId = `temp_${Date.now()}`;
        profile = {
          id: tempId, firstName: form.firstName.trim(), lastName: form.lastName.trim(),
          dateOfBirth: form.dateOfBirth.trim(), relationship: form.relationship,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        };
        await enqueueAction({ type: 'CREATE_MEMBER', data: { firstName: profile.firstName, lastName: profile.lastName, dateOfBirth: profile.dateOfBirth, relationship: profile.relationship }, tempId });
      }
      await insertProfile(profile);
      upsertProfile(profile);
      onSuccess(profile);
      setForm({ firstName: '', lastName: '', dateOfBirth: '', relationship: '' });
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
              <Text style={m.title}>Ajouter un membre</Text>
              <TouchableOpacity onPress={onClose} style={m.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {errors.general && (
                <View style={m.errorBanner}><Text style={m.errorText}>{errors.general}</Text></View>
              )}
              <View style={m.row}>
                <Input label="Prénom" placeholder="Marie" value={form.firstName} onChangeText={update('firstName')} autoCapitalize="words" error={errors.firstName} required containerStyle={m.half} />
                <Input label="Nom" placeholder="Dupont" value={form.lastName} onChangeText={update('lastName')} autoCapitalize="words" error={errors.lastName} required containerStyle={m.half} />
              </View>
              <Input label="Date de naissance" placeholder="1990-01-15" value={form.dateOfBirth} onChangeText={update('dateOfBirth')} error={errors.dateOfBirth} required hint="Format : AAAA-MM-JJ" />
              <Text style={m.relLabel}>Relation <Text style={{ color: colors.error }}>*</Text></Text>
              <View style={m.relGrid}>
                {RELATIONSHIPS.map((rel) => (
                  <TouchableOpacity key={rel} style={[m.chip, form.relationship === rel && m.chipActive]} onPress={() => setForm((f) => ({ ...f, relationship: rel }))}>
                    <Text style={[m.chipText, form.relationship === rel && m.chipTextActive]}>{rel}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.relationship && <Text style={m.errorText}>{errors.relationship}</Text>}
              <Button label="Ajouter le membre" onPress={handleAdd} loading={loading} fullWidth size="lg" style={{ marginTop: 16 }} />
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

export default function MembersScreen() {
  const router = useRouter();
  const profiles = useStore(selectProfiles);
  const medications = useStore(selectMedications);
  const upsertProfile = useStore((s) => s.upsertProfile);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fullSync().catch(() => {});
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>Membres</Text>
          <Text style={styles.subtitle}>{profiles.length} membre{profiles.length !== 1 ? 's' : ''} du foyer</Text>
        </View>
        <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
          <Plus size={22} color="#FFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        {profiles.length === 0 ? (
          <View style={styles.empty}>
            <Users size={56} color={colors.primaryLight} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Aucun membre</Text>
            <Text style={styles.emptyText}>Ajoutez les membres de votre foyer pour gérer leurs médicaments.</Text>
            <Button label="Ajouter un membre" onPress={() => setShowAdd(true)} icon={<Plus size={18} color="#FFF" />} style={{ marginTop: 8 }} />
          </View>
        ) : (
          profiles.map((profile) => (
            <MemberCard
              key={profile.id}
              profile={profile}
              medications={medications.filter((m) => m.profileId === profile.id)}
              onPress={() => router.push({ pathname: '/(app)/member/[id]', params: { id: profile.id } })}
            />
          ))
        )}
      </ScrollView>

      <AddMemberModal visible={showAdd} onClose={() => setShowAdd(false)} onSuccess={(p) => upsertProfile(p)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
  },
  title: { fontFamily: 'FunnelDisplay_800ExtraBold', fontSize: 26, color: colors.text },
  subtitle: { fontFamily: 'FunnelDisplay_400Regular', fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  fab: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadows.md },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  empty: { alignItems: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.xl, gap: 12 },
  emptyTitle: { fontFamily: 'FunnelDisplay_700Bold', fontSize: 20, color: colors.text },
  emptyText: { fontFamily: 'FunnelDisplay_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  kav: { justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: '90%' },
  handle: { width: 40, height: 4, borderRadius: 0, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  title: { fontFamily: 'FunnelDisplay_800ExtraBold', fontSize: 20, color: colors.text },
  closeBtn: { width: 34, height: 34, borderRadius: radius.full, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  errorBanner: { backgroundColor: colors.errorLight, borderRadius: radius.sm, padding: 10, marginBottom: 12 },
  errorText: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 12, color: colors.error },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  relLabel: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  relGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 13, color: colors.textSecondary, textTransform: 'capitalize' },
  chipTextActive: { color: colors.primary },
});
