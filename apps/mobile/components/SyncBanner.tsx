import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react-native';
import { colors, radius, spacing } from '../src/theme';
import { useStore, selectAppState } from '../src/store/useStore';

interface SyncBannerProps {
  onSyncPress?: () => void;
}

export function SyncBanner({ onSyncPress }: SyncBannerProps) {
  const appState = useStore(selectAppState);

  if (!appState.isOnline) {
    return (
      <View style={[styles.banner, styles.offline]}>
        <WifiOff size={14} color={colors.warning} strokeWidth={2.5} />
        <Text style={[styles.text, { color: colors.warning }]}>
          Mode hors ligne, données locales
        </Text>
      </View>
    );
  }

  if (appState.isSyncing) {
    return (
      <View style={[styles.banner, styles.syncing]}>
        <RefreshCw size={14} color={colors.primary} strokeWidth={2.5} />
        <Text style={[styles.text, { color: colors.primary }]}>Synchronisation…</Text>
      </View>
    );
  }

  if (appState.syncError) {
    return (
      <TouchableOpacity style={[styles.banner, styles.error]} onPress={onSyncPress}>
        <AlertCircle size={14} color={colors.error} strokeWidth={2.5} />
        <Text style={[styles.text, { color: colors.error }]} numberOfLines={1}>
          Erreur sync, Réessayer
        </Text>
      </TouchableOpacity>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    marginHorizontal: spacing.md,
    marginBottom: 4,
  },
  offline: {
    backgroundColor: colors.warningLight,
  },
  syncing: {
    backgroundColor: colors.primaryLight,
  },
  error: {
    backgroundColor: colors.errorLight,
  },
  text: {
    fontFamily: 'FunnelDisplay_600SemiBold',
    fontSize: 12,
    flex: 1,
  },
});
