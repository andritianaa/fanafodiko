import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { Home, Users, History, Settings, Map, Search, Building2 } from 'lucide-react-native';
import { colors, radius } from '../../../src/theme';
import { useStore, selectMyPharmacies } from '../../../src/store/useStore';

type TabDef = {
  name: string;
  label: string;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  isFAB?: boolean;
};

const ALL_TABS: TabDef[] = [
  { name: 'index', label: 'Accueil', Icon: Home },
  { name: 'map', label: 'Carte', Icon: Map },
  { name: 'my-pharmacy', label: 'Pharmacie', Icon: Building2 },
  { name: 'med-search', label: 'Recherche', Icon: Search, isFAB: true },
  { name: 'members', label: 'Membres', Icon: Users },
  { name: 'settings', label: 'Réglages', Icon: Settings },
];

const BASE_TABS: TabDef[] = ALL_TABS.filter((t) => t.name !== 'my-pharmacy');

function TabBar({
  state,
  navigation,
}: {
  state: { index: number; routes: Array<{ name: string }> };
  descriptors: Record<string, unknown>;
  navigation: { navigate: (name: string) => void };
}) {
  const myPharmacies = useStore(selectMyPharmacies);
  const isStaff = myPharmacies.length > 0;

  const tabs = isStaff ? ALL_TABS : BASE_TABS;
  const currentRouteName = state.routes[state.index]?.name;

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
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
                <Icon size={24} color="#FFF" strokeWidth={2.5} />
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
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, animation: 'shift' }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="my-pharmacy" />
      <Tabs.Screen name="med-search" />
      <Tabs.Screen name="members" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingHorizontal: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabItemFAB: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    marginTop: -16,
  },
  tabIconWrap: {
    width: 44,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: colors.primaryLight,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  fabActive: {
    backgroundColor: colors.primaryDark,
  },
  tabLabel: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 10,
    color: colors.textMuted,
  },
  tabLabelActive: {
    fontFamily: 'Nunito_700Bold',
    color: colors.primary,
  },
});
