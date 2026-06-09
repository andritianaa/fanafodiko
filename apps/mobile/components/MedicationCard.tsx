import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Pill, Clock, Calendar, ChevronRight, Pause, Play } from 'lucide-react-native';
import { colors, radius, shadows, spacing } from '../src/theme';
import type { Medication } from '../src/types';

const FREQ_LABELS: Record<string, string> = {
  DAILY: 'Quotidien',
  WEEKLY: 'Hebdomadaire',
  INTERVAL: 'Intervalle',
};

const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Lun',
  TUESDAY: 'Mar',
  WEDNESDAY: 'Mer',
  THURSDAY: 'Jeu',
  FRIDAY: 'Ven',
  SATURDAY: 'Sam',
  SUNDAY: 'Dim',
};

interface MedicationCardProps {
  medication: Medication;
  onPress: () => void;
  onToggleStatus?: () => void;
}

export function MedicationCard({ medication, onPress, onToggleStatus }: MedicationCardProps) {
  const { frequency, isActive } = medication;

  const timeLabel =
    frequency.times.length === 1
      ? frequency.times[0]
      : `${frequency.times.length} prises/j`;

  const dayLabel =
    frequency.type === 'WEEKLY' && frequency.days?.length
      ? frequency.days.map((d) => DAY_SHORT[d] ?? d).join(', ')
      : null;

  return (
    <TouchableOpacity
      style={[styles.card, !isActive && styles.cardInactive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconBox, !isActive && styles.iconBoxInactive]}>
        <Pill
          size={20}
          color={isActive ? colors.primary : colors.textMuted}
          strokeWidth={2}
        />
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, !isActive && styles.nameInactive]} numberOfLines={1}>
            {medication.name}
          </Text>
          {!isActive && (
            <View style={styles.pausedBadge}>
              <Text style={styles.pausedText}>Pausé</Text>
            </View>
          )}
        </View>
        <Text style={styles.dosage}>{medication.dosage}</Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Clock size={11} color={colors.textMuted} strokeWidth={2} />
            <Text style={styles.metaText}>{timeLabel}</Text>
          </View>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{FREQ_LABELS[frequency.type]}</Text>
          {dayLabel && (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{dayLabel}</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.right}>
        {onToggleStatus && (
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={onToggleStatus}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 4 }}
          >
            {isActive ? (
              <Pause size={16} color={colors.textMuted} strokeWidth={2} />
            ) : (
              <Play size={16} color={colors.success} strokeWidth={2} />
            )}
          </TouchableOpacity>
        )}
        <ChevronRight size={17} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: 10,
    ...shadows.sm,
  },
  cardInactive: {
    opacity: 0.65,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconBoxInactive: {
    backgroundColor: '#F3F4F6',
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  name: {
    fontFamily: 'FunnelDisplay_700Bold',
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  nameInactive: {
    color: colors.textSecondary,
  },
  dosage: {
    fontFamily: 'FunnelDisplay_600SemiBold',
    fontSize: 13,
    color: colors.primary,
    marginBottom: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontFamily: 'FunnelDisplay_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
  metaDot: {
    fontSize: 11,
    color: colors.textMuted,
  },
  pausedBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  pausedText: {
    fontFamily: 'FunnelDisplay_600SemiBold',
    fontSize: 10,
    color: colors.textMuted,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleBtn: {
    padding: 4,
  },
});
