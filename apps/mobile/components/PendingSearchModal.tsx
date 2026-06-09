import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, ActivityIndicator,
} from 'react-native';
import {
  X, ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Search, MapPin, FileText,
} from 'lucide-react-native';
import { colors, spacing, radius, shadows } from '../src/theme';
import type { PendingSearch } from '../src/types';

export interface PendingEntry {
  search: PendingSearch;
  pharmacyId: string;
  pharmacyName: string;
}

interface Props {
  visible: boolean;
  entries: PendingEntry[];
  onRespond: (searchId: string, pharmacyId: string, hasStock: boolean) => Promise<void>;
  onDismiss: () => void;
}

export function PendingSearchModal({ visible, entries, onRespond, onDismiss }: Props) {
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const current = entries[Math.min(index, entries.length - 1)];
  const total = entries.length;

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleRespond = async (hasStock: boolean) => {
    if (!current || loading) return;
    setLoading(true);
    try {
      await onRespond(current.search.searchId, current.pharmacyId, hasStock);
      // After responding, move to next or close
      if (total <= 1) {
        onDismiss();
      } else {
        setIndex((prev) => Math.max(0, Math.min(prev, total - 2)));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!current) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.alertBadge}>
              <Search size={14} color={colors.primary} />
              <Text style={styles.alertBadgeText}>Demande de médicament</Text>
            </View>
            {total > 1 && (
              <Text style={styles.counter}>{index + 1} / {total}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Pharmacy */}
          <View style={styles.pharmacyRow}>
            <View style={styles.pharmacyIcon}>
              <MapPin size={18} color={colors.primary} />
            </View>
            <Text style={styles.pharmacyName}>{current.pharmacyName}</Text>
          </View>

          {/* Main card */}
          <View style={styles.searchCard}>
            <Text style={styles.medLabel}>Médicament demandé</Text>
            <Text style={styles.medName}>{current.search.medicationName}</Text>

            <View style={styles.divider} />

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Rayon</Text>
                <Text style={styles.metaValue}>{current.search.radiusKm} km</Text>
              </View>
              {current.search.createdAt && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Reçu à</Text>
                  <Text style={styles.metaValue}>{formatDate(current.search.createdAt)}</Text>
                </View>
              )}
            </View>

            {current.search.note ? (
              <>
                <View style={styles.divider} />
                <View style={styles.noteRow}>
                  <FileText size={14} color={colors.textMuted} />
                  <Text style={styles.noteText}>{current.search.note}</Text>
                </View>
              </>
            ) : null}
          </View>

          {/* Response buttons */}
          <Text style={styles.responseLabel}>Avez-vous ce médicament en stock ?</Text>

          <View style={styles.responseButtons}>
            <TouchableOpacity
              style={[styles.responseBtn, styles.responseBtnOk]}
              onPress={() => handleRespond(true)}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.success} size="small" />
              ) : (
                <>
                  <CheckCircle size={22} color={colors.success} strokeWidth={2.5} />
                  <Text style={[styles.responseBtnText, { color: colors.success }]}>Disponible</Text>
                  <Text style={styles.responseBtnSub}>En stock</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.responseBtn, styles.responseBtnNok]}
              onPress={() => handleRespond(false)}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.error} size="small" />
              ) : (
                <>
                  <XCircle size={22} color={colors.error} strokeWidth={2.5} />
                  <Text style={[styles.responseBtnText, { color: colors.error }]}>Indisponible</Text>
                  <Text style={styles.responseBtnSub}>Rupture de stock</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Navigation entre demandes */}
        {total > 1 && (
          <View style={styles.nav}>
            <TouchableOpacity
              style={[styles.navBtn, index === 0 && styles.navBtnDisabled]}
              onPress={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
            >
              <ChevronLeft size={20} color={index === 0 ? colors.textMuted : colors.primary} />
              <Text style={[styles.navBtnText, index === 0 && { color: colors.textMuted }]}>
                Précédente
              </Text>
            </TouchableOpacity>

            <View style={styles.dotsRow}>
              {entries.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === index && styles.dotActive]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.navBtn, index === total - 1 && styles.navBtnDisabled]}
              onPress={() => setIndex((i) => Math.min(total - 1, i + 1))}
              disabled={index === total - 1}
            >
              <Text style={[styles.navBtnText, index === total - 1 && { color: colors.textMuted }]}>
                Suivante
              </Text>
              <ChevronRight size={20} color={index === total - 1 ? colors.textMuted : colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLighter,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  alertBadgeText: {
    fontFamily: 'FunnelDisplay_700Bold',
    fontSize: 13,
    color: colors.primary,
  },
  counter: {
    fontFamily: 'FunnelDisplay_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { padding: spacing.lg, gap: spacing.lg },

  pharmacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pharmacyIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pharmacyName: {
    fontFamily: 'FunnelDisplay_700Bold',
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },

  searchCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  medLabel: {
    fontFamily: 'FunnelDisplay_600SemiBold',
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  medName: {
    fontFamily: 'FunnelDisplay_800ExtraBold',
    fontSize: 24,
    color: colors.text,
    lineHeight: 30,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 2,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  metaItem: { gap: 2 },
  metaLabel: {
    fontFamily: 'FunnelDisplay_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontFamily: 'FunnelDisplay_700Bold',
    fontSize: 15,
    color: colors.text,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noteText: {
    fontFamily: 'FunnelDisplay_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  responseLabel: {
    fontFamily: 'FunnelDisplay_700Bold',
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
  },
  responseButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  responseBtn: {
    flex: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    minHeight: 110,
    justifyContent: 'center',
  },
  responseBtnOk: {
    backgroundColor: colors.successLight,
    borderColor: '#86efac',
  },
  responseBtnNok: {
    backgroundColor: colors.errorLight,
    borderColor: '#fca5a5',
  },
  responseBtnText: {
    fontFamily: 'FunnelDisplay_800ExtraBold',
    fontSize: 16,
  },
  responseBtnSub: {
    fontFamily: 'FunnelDisplay_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },

  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: spacing.sm,
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: {
    fontFamily: 'FunnelDisplay_600SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 0,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 16,
    borderRadius: 0,
  },
});
