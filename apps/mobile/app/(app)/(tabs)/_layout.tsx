import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { Home, Users, History, Settings } from 'lucide-react-native';
import { colors, radius } from '../../../src/theme';

function TabBar({ state, descriptors, navigation }: {
  state: { index: number; routes: Array<{ name: string }> };
  descriptors: Record<string, unknown>;
  navigation: { navigate: (name: string) => void };
}) {
  const tabs = [
    { name: 'index', label: 'Accueil', Icon: Home },
    { name: 'members', label: 'Membres', Icon: Users },
    { name: 'history', label: 'Historique', Icon: History },
    { name: 'settings', label: 'Réglages', Icon: Settings },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab, i) => {
        const isFocused = state.index === i;
        const Icon = tab.Icon;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => {
              if (!isFocused) navigation.navigate(tab.name);
            }}
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
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="members" />
      <Tabs.Screen name="history" />
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
    paddingHorizontal: 8,
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
