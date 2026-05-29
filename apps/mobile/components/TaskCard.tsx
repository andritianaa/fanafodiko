import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, X, SkipForward, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, spacing } from '../src/theme';
import { TaskStatusBadge } from './ui/Badge';
import type { Task } from '../src/types';

interface TaskCardProps {
  task: Task;
  medicationName?: string;
  medicationDosage?: string;
  onTake?: () => void;
  onSkip?: () => void;
  compact?: boolean;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getTimeStatus(scheduledAt: string): 'past' | 'now' | 'future' {
  const scheduled = new Date(scheduledAt).getTime();
  const now = Date.now();
  const diff = scheduled - now;
  if (diff < -30 * 60 * 1000) return 'past';
  if (diff <= 30 * 60 * 1000) return 'now';
  return 'future';
}

export function TaskCard({
  task,
  medicationName,
  medicationDosage,
  onTake,
  onSkip,
  compact = false,
}: TaskCardProps) {
  const name = task.medicationName ?? medicationName ?? '—';
  const dosage = task.medicationDosage ?? medicationDosage ?? '';
  const timeStatus = getTimeStatus(task.scheduledAt);
  const isPending = task.status === 'PENDING';
  const isNow = timeStatus === 'now' && isPending;

  const handleTake = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onTake?.();
  };

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSkip?.();
  };

  return (
    <View
      style={[
        styles.card,
        isNow && styles.cardUrgent,
        task.status === 'TAKEN' && styles.cardTaken,
        task.status === 'MISSED' && styles.cardMissed,
        compact && styles.cardCompact,
      ]}
    >
      <View style={[styles.timePill, isNow && styles.timePillUrgent]}>
        <Clock
          size={12}
          color={isNow ? colors.white : colors.textSecondary}
          strokeWidth={2.5}
        />
        <Text style={[styles.time, isNow && styles.timeUrgent]}>
          {formatTime(task.scheduledAt)}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {dosage ? (
          <Text style={styles.dosage}>{dosage}</Text>
        ) : null}
      </View>

      <View style={styles.right}>
        {isPending ? (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.skipBtn]}
              onPress={handleSkip}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
            >
              <SkipForward size={15} color={colors.warning} strokeWidth={2.5} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.takeBtn]}
              onPress={handleTake}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
            >
              <Check size={15} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        ) : (
          <TaskStatusBadge status={task.status} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    ...shadows.sm,
  },
  cardUrgent: {
    borderLeftColor: colors.primary,
    backgroundColor: colors.primaryLighter,
    ...shadows.md,
  },
  cardTaken: {
    borderLeftColor: colors.success,
    opacity: 0.8,
  },
  cardMissed: {
    borderLeftColor: colors.error,
  },
  cardCompact: {
    padding: 12,
    marginBottom: 6,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.divider,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginRight: 12,
    gap: 4,
    minWidth: 60,
  },
  timePillUrgent: {
    backgroundColor: colors.primary,
  },
  time: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    color: colors.textSecondary,
  },
  timeUrgent: {
    color: colors.white,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  dosage: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  right: {
    alignItems: 'flex-end',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takeBtn: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  skipBtn: {
    backgroundColor: colors.warningLight,
  },
});
