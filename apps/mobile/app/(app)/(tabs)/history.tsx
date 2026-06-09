import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, History } from 'lucide-react-native';
import { getTasksByDate } from '../../../src/db/database';
import { useStore, selectMedications, selectProfiles } from '../../../src/store/useStore';
import { TaskCard } from '../../../components/TaskCard';
import { colors, spacing, radius } from '../../../src/theme';
import type { Task, TaskStatus } from '../../../src/types';

type Filter = 'ALL' | TaskStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'Tous' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'TAKEN', label: 'Pris' },
  { key: 'MISSED', label: 'Manqués' },
  { key: 'SKIPPED', label: 'Passés' },
];

function toDateStr(d: Date) { return d.toISOString().split('T')[0]; }

function formatDateFr(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[sp.pill, { backgroundColor: color + '22' }]}>
      <Text style={[sp.num, { color }]}>{value}</Text>
      <Text style={[sp.lbl, { color }]}>{label}</Text>
    </View>
  );
}
const sp = StyleSheet.create({
  pill: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md, flex: 1 },
  num: { fontFamily: 'FunnelDisplay_800ExtraBold', fontSize: 20 },
  lbl: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 11, marginTop: 1 },
});

export default function HistoryScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const medications = useStore(selectMedications);
  const profiles    = useStore(selectProfiles);

  const medById = useMemo(
    () => Object.fromEntries(medications.map((m) => [m.id, m])),
    [medications],
  );
  const profileById = useMemo(
    () => Object.fromEntries(profiles.map((p) => [p.id, p])),
    [profiles],
  );
  const loadTasks = useCallback(async (date: Date) => {
    const loaded = await getTasksByDate(toDateStr(date));
    setTasks(loaded);
  }, []);

  useEffect(() => { loadTasks(selectedDate); }, [selectedDate, loadTasks]);

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate); d.setDate(d.getDate() + days); setSelectedDate(d);
  };

  const filtered = tasks.filter((t) => filter === 'ALL' || t.status === filter);
  const taken = tasks.filter((t) => t.status === 'TAKEN').length;
  const missed = tasks.filter((t) => t.status === 'MISSED').length;
  const skipped = tasks.filter((t) => t.status === 'SKIPPED').length;
  const pending = tasks.filter((t) => t.status === 'PENDING').length;
  const adherence = tasks.length > 0 ? Math.round((taken / tasks.length) * 100) : 0;
  const isToday = toDateStr(selectedDate) === toDateStr(new Date());

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Planning</Text>
      </View>

      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => shiftDate(-1)}>
          <ChevronLeft size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateBox} onPress={() => setSelectedDate(new Date())}>
          <Text style={styles.dateTxt}>{formatDateFr(selectedDate)}</Text>
          <Text style={styles.dateSubTxt}>{selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navBtn, isToday && styles.navBtnOff]} onPress={() => !isToday && shiftDate(1)} disabled={isToday}>
          <ChevronRight size={22} color={isToday ? colors.textMuted : colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTasks(selectedDate).then(() => setRefreshing(false)); }} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        {tasks.length > 0 && (
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <StatPill label="Pris" value={taken} color={colors.success} />
              <StatPill label="Manqués" value={missed} color={colors.error} />
              <StatPill label="Passés" value={skipped} color={colors.warning} />
              <StatPill label="Attente" value={pending} color={colors.primary} />
            </View>
            <View style={styles.adherenceRow}>
              <Text style={styles.adherenceLbl}>Observance</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${adherence}%` }]} />
              </View>
              <Text style={styles.adherencePct}>{adherence}%</Text>
            </View>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity key={f.key} style={[styles.chip, filter === f.key && styles.chipActive]} onPress={() => setFilter(f.key)}>
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.taskList}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <History size={48} color={colors.primaryLight} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>{tasks.length === 0 ? 'Aucune prise ce jour' : 'Aucun résultat'}</Text>
              <Text style={styles.emptyText}>{tasks.length === 0 ? 'Le planning pour cette date est vide.' : 'Modifiez le filtre.'}</Text>
            </View>
          ) : (
            filtered.slice().sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()).map((t) => {
              const med = medById[t.medicationId];
              return (
                <TaskCard
                  key={t.id} task={t}
                  medicationName={med?.name}
                  medicationDosage={med?.dosage}
                  profileName={profileById[t.profileId]?.firstName}
                />
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontFamily: 'FunnelDisplay_800ExtraBold', fontSize: 26, color: colors.text },
  dateNav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 8 },
  navBtn: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  navBtnOff: { backgroundColor: colors.divider },
  dateBox: { flex: 1, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, paddingVertical: 10, borderWidth: 1, borderColor: colors.border },
  dateTxt: { fontFamily: 'FunnelDisplay_700Bold', fontSize: 15, color: colors.text, textTransform: 'capitalize' },
  dateSubTxt: { fontFamily: 'FunnelDisplay_400Regular', fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  statsCard: { margin: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  adherenceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  adherenceLbl: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 12, color: colors.textSecondary, width: 70 },
  barBg: { flex: 1, height: 6, backgroundColor: colors.divider, borderRadius: 0, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 0 },
  adherencePct: { fontFamily: 'FunnelDisplay_700Bold', fontSize: 13, color: colors.primary, width: 38, textAlign: 'right' },
  filters: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.primary },
  taskList: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  empty: { alignItems: 'center', paddingTop: spacing.xl, paddingHorizontal: spacing.xl, gap: 12 },
  emptyTitle: { fontFamily: 'FunnelDisplay_700Bold', fontSize: 18, color: colors.text },
  emptyText: { fontFamily: 'FunnelDisplay_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
