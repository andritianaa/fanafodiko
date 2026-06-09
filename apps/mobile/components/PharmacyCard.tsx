import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, Platform,
} from 'react-native';
import { MapPin, Phone, Navigation, ChevronRight, Clock } from 'lucide-react-native';
import { colors, spacing, radius, shadows } from '../src/theme';
import type { Pharmacy } from '../src/types';

interface Props {
  pharmacy: Pharmacy;
  onViewDetails: () => void;
  onGetDirections?: () => void;
  onPress?: () => void;
  compact?: boolean;
}

function StatusBadge({ pharmacy }: { pharmacy: Pharmacy }) {
  if (pharmacy.isOpen24h) {
    return (
      <View style={[badge.base, { backgroundColor: '#e0f2fe' }]}>
        <View style={[badge.dot, { backgroundColor: '#0284c7' }]} />
        <Text style={[badge.text, { color: '#0284c7' }]}>24h/24</Text>
      </View>
    );
  }
  if (pharmacy.isOnGuard) {
    return (
      <View style={[badge.base, { backgroundColor: colors.primaryLight }]}>
        <View style={[badge.dot, { backgroundColor: colors.primary }]} />
        <Text style={[badge.text, { color: colors.primary }]}>De garde</Text>
      </View>
    );
  }
  if (pharmacy.isOpenNow) {
    return (
      <View style={[badge.base, { backgroundColor: colors.successLight }]}>
        <View style={[badge.dot, { backgroundColor: colors.success }]} />
        <Text style={[badge.text, { color: colors.success }]}>Ouvert</Text>
      </View>
    );
  }
  return (
    <View style={[badge.base, { backgroundColor: colors.errorLight }]}>
      <View style={[badge.dot, { backgroundColor: colors.error }]} />
      <Text style={[badge.text, { color: colors.error }]}>Fermé</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  dot: { width: 6, height: 6, borderRadius: 0 },
  text: { fontFamily: 'FunnelDisplay_600SemiBold', fontSize: 11 },
});

export function PharmacyCard({ pharmacy, onViewDetails, onGetDirections, onPress, compact = false }: Props) {
  const phone = pharmacy.contacts.find((c) => c.type === 'phone')?.value ?? pharmacy.phone;
  const todayHour = pharmacy.openingHours[new Date().getDay()];

  const handleDirections = () => {
    if (onGetDirections) {
      onGetDirections();
      return;
    }
    const { lat, lng } = pharmacy.coordinates;
    const coords = `${lat},${lng}`;
    const url =
      Platform.OS === 'ios'
        ? `maps://?q=${encodeURIComponent(pharmacy.name)}&ll=${coords}`
        : `geo:${coords}?q=${encodeURIComponent(pharmacy.name)}`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${coords}`)
    );
  };

  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.nameWrap}>
          <Text style={styles.name} numberOfLines={1}>
            {pharmacy.name}
          </Text>
          <StatusBadge pharmacy={pharmacy} />
        </View>
      </View>

      {/* Address */}
      <View style={styles.row}>
        <MapPin size={13} color={colors.textMuted} />
        <Text style={styles.address} numberOfLines={2}>
          {pharmacy.address}
          {pharmacy.landmark ? ` · ${pharmacy.landmark}` : ''}
        </Text>
      </View>

      {/* Today hours */}
      {todayHour && !compact && (
        <View style={styles.row}>
          <Clock size={13} color={colors.textMuted} />
          <Text style={styles.hours}>
            {todayHour.isClosed
              ? "Fermé aujourd'hui"
              : `Aujourd'hui : ${todayHour.open} – ${todayHour.close}`}
          </Text>
        </View>
      )}

      {/* Phone */}
      {phone && !compact && (
        <TouchableOpacity
          style={styles.row}
          onPress={() => Linking.openURL(`tel:${phone}`)}
          hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
        >
          <Phone size={13} color={colors.primary} />
          <Text style={styles.phone}>{phone}</Text>
        </TouchableOpacity>
      )}

      {/* Actions */}
      {!compact && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtnOutline}
            onPress={handleDirections}
            activeOpacity={0.8}
          >
            <Navigation size={15} color={colors.primary} />
            <Text style={styles.actionBtnOutlineText}>Y aller</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={onViewDetails}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnPrimaryText}>Voir détails</Text>
            <ChevronRight size={15} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {compact && (
        <TouchableOpacity style={styles.compactBtn} onPress={onViewDetails} activeOpacity={0.8}>
          <Text style={styles.compactBtnText}>Voir détails</Text>
          <ChevronRight size={14} color={colors.primary} />
        </TouchableOpacity>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm - 2,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  nameWrap: { flex: 1, gap: 5 },
  name: {
    fontFamily: 'FunnelDisplay_800ExtraBold',
    fontSize: 17,
    color: colors.text,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  address: {
    fontFamily: 'FunnelDisplay_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  hours: {
    fontFamily: 'FunnelDisplay_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  phone: {
    fontFamily: 'FunnelDisplay_600SemiBold',
    fontSize: 13,
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 9,
  },
  actionBtnOutlineText: {
    fontFamily: 'FunnelDisplay_700Bold',
    fontSize: 14,
    color: colors.primary,
  },
  actionBtnPrimary: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 9,
  },
  actionBtnPrimaryText: {
    fontFamily: 'FunnelDisplay_700Bold',
    fontSize: 14,
    color: '#FFF',
  },
  compactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 2,
  },
  compactBtnText: {
    fontFamily: 'FunnelDisplay_600SemiBold',
    fontSize: 13,
    color: colors.primary,
  },
});
