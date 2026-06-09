import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { useStore, selectTodayTasks, selectProfiles, selectMedications, selectAppState } from '../../../src/store/useStore';
import { fullSync } from '../../../src/sync/syncService';
import { updateTaskStatus, enqueueAction } from '../../../src/db/database';
import { cancelNotificationForDose } from '../../../src/notifications/scheduler';
import { tasksApi, ApiError } from '../../../src/api/client';
import { TaskCard } from '../../../components/TaskCard';
import { SyncBanner } from '../../../components/SyncBanner';
import { colors, spacing, radius } from '../../../src/theme';
import type { Task } from '../../../src/types';

function ProgressRing({ taken, total }: { taken: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((taken / total) * 100);
  return (
    <View style={ring.container}>
      <View style={ring.outer}>
        <View style={ring.inner}>
          <Text style={ring.pct}>{pct}%</Text>
          <Text style={ring.lbl}>pris</Text>
        </View>
      </View>
      <Text style={ring.cap}>{taken}/{total} aujourd'hui</Text>
    </View>
  );
}

const ring = StyleSheet.create({
  container: { alignItems: 'center' },
  outer: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 5, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  inner: { alignItems: 'center' },
  pct: { fontFamily: 'FunnelDisplay_800ExtraBold', fontSize: 20, color: '#FFF' },
  lbl: { fontFamily: 'FunnelDisplay_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  cap: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 6 },
});

function getDayGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function formatDateFr(date: Date) {
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function DashboardScreen() {
  const user = useStore((s) => s.user);
  const tasks = useStore(selectTodayTasks);
  const profiles = useStore(selectProfiles);
  const medications = useStore(selectMedications);
  const appState = useStore(selectAppState);

  // Lookups id → nom pour l'affichage dans les cartes
  const medById = useMemo(
    () => Object.fromEntries(medications.map((m) => [m.id, m])),
    [medications],
  );
  const profileById = useMemo(
    () => Object.fromEntries(profiles.map((p) => [p.id, p])),
    [profiles],
  );
  const updateStoreTask = useStore((s) => s.updateTaskStatus);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();
  const firstName = profiles[0]?.firstName ?? user?.email?.split('@')[0] ?? 'vous';
  const takenCount = tasks.filter((t) => t.status === 'TAKEN').length;

  const nowTasks = tasks.filter((t) => {
    if (t.status !== 'PENDING') return false;
    const diff = new Date(t.scheduledAt).getTime() - Date.now();
    return diff >= -30 * 60 * 1000 && diff <= 30 * 60 * 1000;
  });

  const upcomingTasks = tasks
    .filter((t) => t.status === 'PENDING' && new Date(t.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fullSync().catch(() => {});
    setRefreshing(false);
  }, []);

  const handleTake = useCallback(async (task: Task) => {
    const now = new Date().toISOString();
    updateStoreTask(task.id, 'TAKEN');
    await updateTaskStatus(task.id, 'TAKEN', now);
    await cancelNotificationForDose(task.medicationId, task.scheduledAt);
    if (appState.isOnline) {
      tasksApi.markTaken(task.id).catch(async (err) => {
        // 404 = tâche introuvable sur le serveur, pas la peine de ré-enqueuer
        if (err instanceof ApiError && err.status === 404) return;
        await enqueueAction({ type: 'TAKE_TASK', taskId: task.id, takenAt: now });
      });
    } else {
      await enqueueAction({ type: 'TAKE_TASK', taskId: task.id, takenAt: now });
    }
  }, [appState.isOnline, updateStoreTask]);

  const handleSkip = useCallback(async (task: Task) => {
    updateStoreTask(task.id, 'SKIPPED');
    await updateTaskStatus(task.id, 'SKIPPED');
    await cancelNotificationForDose(task.medicationId, task.scheduledAt);
    if (appState.isOnline) {
      tasksApi.markSkipped(task.id).catch(async (err) => {
        if (err instanceof ApiError && err.status === 404) return;
        await enqueueAction({ type: 'SKIP_TASK', taskId: task.id });
      });
    } else {
      await enqueueAction({ type: 'SKIP_TASK', taskId: task.id });
    }
  }, [appState.isOnline, updateStoreTask]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}
            colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getDayGreeting()},</Text>
            <Text style={styles.name}>{firstName} 👋</Text>
            <Text style={styles.date}>{formatDateFr(today)}</Text>
          </View>
          <ProgressRing taken={takenCount} total={tasks.length} />
        </View>

        <SyncBanner onSyncPress={handleRefresh} />

        <View style={styles.body}>
          {nowTasks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.urgentDot} />
                <Text style={styles.sectionTitle}>À prendre maintenant</Text>
              </View>
              {nowTasks.map((t) => {
                const med = medById[t.medicationId];
                return (
                  <TaskCard
                    key={t.id} task={t}
                    medicationName={med?.name}
                    medicationDosage={med?.dosage}
                    profileName={profileById[t.profileId]?.firstName}
                    onTake={() => handleTake(t)} onSkip={() => handleSkip(t)}
                  />
                );
              })}
            </View>
          )}

          {upcomingTasks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Prochaines prises</Text>
              {upcomingTasks.map((t) => {
                const med = medById[t.medicationId];
                return (
                  <TaskCard
                    key={t.id} task={t} compact
                    medicationName={med?.name}
                    medicationDosage={med?.dosage}
                    profileName={profileById[t.profileId]?.firstName}
                    onTake={() => handleTake(t)} onSkip={() => handleSkip(t)}
                  />
                );
              })}
            </View>
          )}

          {tasks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Toutes les prises du jour</Text>
              {tasks
                .slice()
                .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                .map((t) => {
                  const med = medById[t.medicationId];
                  return (
                    <TaskCard
                      key={t.id} task={t} compact
                      medicationName={med?.name}
                      medicationDosage={med?.dosage}
                      profileName={profileById[t.profileId]?.firstName}
                      onTake={t.status === 'PENDING' ? () => handleTake(t) : undefined}
                      onSkip={t.status === 'PENDING' ? () => handleSkip(t) : undefined}
                    />
                  );
                })}
            </View>
          )}

          {tasks.length === 0 && (
            <View style={styles.empty}>
              <Bell size={52} color={colors.primaryLight} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>Aucune prise aujourd'hui</Text>
              <Text style={styles.emptyText}>
                Glissez vers le bas pour synchroniser, ou ajoutez des médicaments dans l'onglet Membres.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {},
  greeting: { fontFamily: 'FunnelDisplay_400Regular', fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  name: { fontFamily: 'FunnelDisplay_800ExtraBold', fontSize: 26, color: '#FFF', marginTop: 2, marginBottom: 4 },
  date: { fontFamily: 'FunnelDisplay_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' },
  body: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  section: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  urgentDot: { width: 8, height: 8, borderRadius: 0, backgroundColor: colors.primary },
  sectionTitle: { fontFamily: 'FunnelDisplay_700Bold', fontSize: 16, color: colors.text, marginBottom: spacing.sm },
  empty: { alignItems: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.xl, gap: 12 },
  emptyTitle: { fontFamily: 'FunnelDisplay_700Bold', fontSize: 18, color: colors.text },
  emptyText: { fontFamily: 'FunnelDisplay_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
