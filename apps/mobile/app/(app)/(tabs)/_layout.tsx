import React, { useState, useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Text, Platform,
  Modal, Alert, Dimensions,
} from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import {
  Home, CalendarDays, Search, Map, MoreHorizontal,
  Pill, Users, Settings, Building2, Shield,
  HelpCircle, AlertTriangle, LogOut, X, ChevronRight, Store,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from '../../../src/theme';
import { useStore, selectMyPharmacies } from '../../../src/store/useStore';
import { authApi } from '../../../src/api/client';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Tabs visibles dans la barre du bas ────────────────────────────────────────
// Miroir exact du frontend : Accueil | Planning | Recherche | Carte | Plus

type TabDef = {
  name: string;
  label: string;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  isFAB?: boolean;
};

const VISIBLE_TABS: TabDef[] = [
  { name: 'index',    label: 'Accueil',   Icon: Home },
  { name: 'history',  label: 'Planning',  Icon: CalendarDays },
  { name: 'med-search', label: 'Recherche', Icon: Search, isFAB: true },
  { name: 'map',      label: 'Carte',     Icon: Map },
];

// ── TabBar ─────────────────────────────────────────────────────────────────────

function TabBar({
  state,
  navigation,
}: {
  state: { index: number; routes: Array<{ name: string }> };
  descriptors: Record<string, unknown>;
  navigation: { navigate: (name: string) => void };
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const router = useRouter();
  const myPharmacies = useStore(selectMyPharmacies);
  const user = useStore((s) => s.user);
  const clearAuth = useStore((s) => s.clearAuth);

  const isStaff = myPharmacies.length > 0;
  const isAdmin = user?.role === 'admin' || user?.role === 'support';
  const currentRouteName = state.routes[state.index]?.name;

  const handleLogout = useCallback(() => {
    setMoreOpen(false);
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('expo_push_token');
            if (token) await authApi.removePushToken(token).catch(() => {});
          } catch {}
          clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }, [clearAuth, router]);

  const goTo = useCallback((route: string) => {
    setMoreOpen(false);
    setTimeout(() => router.push(route as any), 100);
  }, [router]);

  return (
    <>
      {/* ── Barre du bas ────────────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {VISIBLE_TABS.map((tab) => {
          const isFocused = currentRouteName === tab.name;
          const Icon = tab.Icon;

          if (tab.isFAB) {
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.tabItemFAB}
                onPress={() => { if (!isFocused) navigation.navigate(tab.name); }}
                activeOpacity={0.8}
              >
                <View style={[styles.fab, isFocused && styles.fabActive]}>
                  <Icon size={22} color="#FFF" strokeWidth={2.5} />
                </View>
                <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => { if (!isFocused) navigation.navigate(tab.name); }}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconWrap, isFocused && styles.tabIconWrapActive]}>
                <Icon
                  size={22}
                  color={isFocused ? colors.primary : colors.textMuted}
                  strokeWidth={isFocused ? 2.5 : 2}
                />
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Bouton Plus */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setMoreOpen(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.tabIconWrap, moreOpen && styles.tabIconWrapActive]}>
            <MoreHorizontal
              size={22}
              color={moreOpen ? colors.primary : colors.textMuted}
              strokeWidth={2}
            />
          </View>
          <Text style={[styles.tabLabel, moreOpen && styles.tabLabelActive]}>Plus</Text>
        </TouchableOpacity>
      </View>

      {/* ── Sheet "Plus" — miroir du frontend ───────────────────────────────── */}
      <Modal
        visible={moreOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setMoreOpen(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setMoreOpen(false)}
        />

        <View style={styles.sheet}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.sheetHandle} />

            {/* En-tête */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Plus de fonctionnalités</Text>
              <TouchableOpacity
                onPress={() => setMoreOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Grille — miroir frontend : Médicaments, Foyer, Mon compte, Ma pharmacie, Backoffice */}
            <View style={styles.grid}>
              <GridItem
                Icon={Pill}
                label="Médicaments"
                onPress={() => goTo('/(app)/(tabs)/members')}
              />
              <GridItem
                Icon={Users}
                label="Foyer"
                onPress={() => goTo('/(app)/(tabs)/members')}
              />
              <GridItem
                Icon={Store}
                label="Suggérer"
                onPress={() => goTo('/(app)/suggest-pharmacy')}
              />
              <GridItem
                Icon={Settings}
                label="Mon compte"
                onPress={() => goTo('/(app)/(tabs)/settings')}
              />
              {isStaff && (
                <GridItem
                  Icon={Building2}
                  label="Ma pharmacie"
                  onPress={() => goTo('/(app)/(tabs)/my-pharmacy')}
                />
              )}
              {isAdmin && (
                <GridItem
                  Icon={Shield}
                  label="Backoffice"
                  accent="orange"
                  onPress={() => setMoreOpen(false)}
                />
              )}
            </View>

            {/* Liste — miroir frontend : Aide & FAQ, Signaler, Déconnexion */}
            <View style={styles.listSection}>
              <ListRow
                Icon={HelpCircle}
                label="Aide & FAQ"
                onPress={() => goTo('/(app)/help')}
              />
              <View style={styles.divider} />
              <ListRow
                Icon={AlertTriangle}
                label="Signaler un problème"
                color={colors.warning}
                onPress={() => goTo('/(app)/(tabs)/settings')}
              />
              <View style={styles.divider} />
              <ListRow
                Icon={LogOut}
                label="Déconnexion"
                color={colors.error}
                onPress={handleLogout}
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

// ── Composants locaux ──────────────────────────────────────────────────────────

function GridItem({
  Icon, label, onPress, accent,
}: {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string;
  onPress: () => void;
  accent?: 'orange';
}) {
  const bg        = accent === 'orange' ? '#fff7ed' : colors.primaryLighter;
  const iconColor = accent === 'orange' ? '#c2410c' : colors.primary;
  const textColor = accent === 'orange' ? '#c2410c' : colors.text;

  return (
    <TouchableOpacity
      style={[styles.gridItem, { backgroundColor: bg, borderColor: accent === 'orange' ? '#fed7aa' : colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon size={26} color={iconColor} strokeWidth={1.5} />
      <Text style={[styles.gridLabel, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ListRow({
  Icon, label, onPress, color,
}: {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  const c = color ?? colors.text;
  return (
    <TouchableOpacity style={styles.listRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.listRowIcon, { backgroundColor: color ? `${color}18` : colors.primaryLighter }]}>
        <Icon size={16} color={c} strokeWidth={2} />
      </View>
      <Text style={[styles.listLabel, { color: c }]}>{label}</Text>
      <ChevronRight size={16} color={colors.textMuted} strokeWidth={2} />
    </TouchableOpacity>
  );
}

// ── Layout racine ──────────────────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, animation: 'shift' }}
    >
      {/* Tabs visibles dans la barre */}
      <Tabs.Screen name="index" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="med-search" />
      <Tabs.Screen name="map" />
      {/* Tabs accessibles via le menu Plus */}
      <Tabs.Screen name="members" />
      <Tabs.Screen name="settings" />
      <Tabs.Screen name="my-pharmacy" />
    </Tabs>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabItemFAB: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    marginTop: -14,
  },
  tabIconWrap: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: colors.primaryLight,
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabActive: {
    backgroundColor: colors.primaryDark,
  },
  tabLabel: {
    fontFamily: 'FunnelDisplay_400Regular',
    fontSize: 10,
    color: colors.textMuted,
  },
  tabLabelActive: {
    fontFamily: 'FunnelDisplay_600SemiBold',
    color: colors.primary,
  },

  // Modal sheet
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    maxHeight: SCREEN_HEIGHT * 0.72,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sheetTitle: {
    fontFamily: 'FunnelDisplay_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.md,
  },
  gridItem: {
    width: '30.5%',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  gridLabel: {
    fontFamily: 'FunnelDisplay_600SemiBold',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },

  // List
  listSection: {
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  listRowIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listLabel: {
    flex: 1,
    fontFamily: 'FunnelDisplay_600SemiBold',
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
});
