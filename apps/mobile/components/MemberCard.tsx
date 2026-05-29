import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { User, ChevronRight, Pill } from 'lucide-react-native';
import { colors, radius, shadows, spacing } from '../src/theme';
import type { Profile, Medication } from '../src/types';

const RELATIONSHIP_COLORS: Record<string, { bg: string; text: string }> = {
  moi: { bg: '#e0e7ff', text: '#4f46e5' },
  conjoint: { bg: '#FCE7F3', text: '#9D174D' },
  enfant: { bg: '#D1FAE5', text: '#065F46' },
  parent: { bg: '#FEF3C7', text: '#92400E' },
  autre: { bg: '#E0F2FE', text: '#075985' },
};

function getRelColor(rel: string) {
  const key = rel.toLowerCase();
  return RELATIONSHIP_COLORS[key] ?? { bg: colors.primaryLight, text: colors.primary };
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

interface MemberCardProps {
  profile: Profile;
  medications: Medication[];
  onPress: () => void;
}

export function MemberCard({ profile, medications, onPress }: MemberCardProps) {
  const relColor = getRelColor(profile.relationship);
  const activeMeds = medications.filter((m) => m.isActive).length;
  const initials = getInitials(profile.firstName, profile.lastName);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{initials}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>
          {profile.firstName} {profile.lastName}
        </Text>
        <View style={styles.row}>
          <View style={[styles.relBadge, { backgroundColor: relColor.bg }]}>
            <Text style={[styles.relText, { color: relColor.text }]}>
              {profile.relationship}
            </Text>
          </View>
          {activeMeds > 0 && (
            <View style={styles.medsRow}>
              <Pill size={11} color={colors.primary} strokeWidth={2} />
              <Text style={styles.medsText}>
                {activeMeds} médicament{activeMeds > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ChevronRight size={18} color={colors.textMuted} />
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  initials: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
    color: colors.primary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: colors.text,
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  relBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  relText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  medsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  medsText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: colors.primary,
  },
});
