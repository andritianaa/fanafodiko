import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radius } from '../../src/theme';
import type { TaskStatus } from '../../src/types';

type BadgeVariant = 'primary' | 'success' | 'error' | 'warning' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  dot?: boolean;
}

const variantMap: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  primary: { bg: colors.status.pendingBg, text: colors.status.pending, dot: colors.status.pending },
  success: { bg: colors.status.takenBg, text: colors.status.taken, dot: colors.status.taken },
  error: { bg: colors.status.missedBg, text: colors.status.missed, dot: colors.status.missed },
  warning: { bg: colors.status.skippedBg, text: colors.status.skipped, dot: colors.status.skipped },
  neutral: { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
};

export function Badge({ label, variant = 'neutral', size = 'md', style, dot }: BadgeProps) {
  const v = variantMap[variant];

  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, size === 'sm' && styles.sm, style]}>
      {dot && (
        <View style={[styles.dot, { backgroundColor: v.dot }]} />
      )}
      <Text style={[styles.text, { color: v.text }, size === 'sm' && styles.textSm]}>
        {label}
      </Text>
    </View>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config: Record<TaskStatus, { label: string; variant: BadgeVariant }> = {
    PENDING: { label: 'À prendre', variant: 'primary' },
    TAKEN: { label: 'Pris', variant: 'success' },
    MISSED: { label: 'Manqué', variant: 'error' },
    SKIPPED: { label: 'Passé', variant: 'warning' },
  };
  const { label, variant } = config[status];
  return <Badge label={label} variant={variant} size="sm" dot />;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    lineHeight: 16,
  },
  textSm: {
    fontSize: 11,
  },
});
