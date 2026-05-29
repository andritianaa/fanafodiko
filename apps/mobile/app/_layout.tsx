import React, { useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { AppState, Platform, View, Text } from 'react-native';
import { useFonts } from 'expo-font';
import {
  setupNotificationChannel,
  requestNotificationPermissions,
  registerBackgroundTask,
  startBackgroundScheduling,
  needsReschedule,
  scheduleAllNotifications,
} from '../src/notifications/scheduler';
import { loadFromLocal } from '../src/sync/syncService';
import { IS_EXPO_GO } from '../src/config/env';

// Pas de SplashScreen.preventAutoHideAsync() — le splash natif (fond blanc)
// s'efface seul dès que React est prêt. Pendant le chargement des polices,
// on affiche un écran minimaliste au lieu de bloquer sur le splash.

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    FunnelDisplay_300Light:   require('../assets/fonts/Funnel_Display-Light.ttf'),
    FunnelDisplay_400Regular: require('../assets/fonts/Funnel_Display-Regular.ttf'),
    FunnelDisplay_500Medium:  require('../assets/fonts/Funnel_Display-Medium.ttf'),
    FunnelDisplay_600SemiBold:require('../assets/fonts/Funnel_Display-SemiBold.ttf'),
    FunnelDisplay_700Bold:    require('../assets/fonts/Funnel_Display-Bold.ttf'),
    FunnelDisplay_800ExtraBold:require('../assets/fonts/Funnel_Display-ExtraBold.ttf'),
  });

  const setupApp = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        await setupNotificationChannel();
      }
      const hasPermission = await requestNotificationPermissions();
      registerBackgroundTask();
      if (hasPermission && !IS_EXPO_GO) {
        await startBackgroundScheduling();
      }
      await loadFromLocal();
      if (hasPermission && (await needsReschedule())) {
        scheduleAllNotifications().catch(() => {});
      }
    } catch (e) {
      if (__DEV__) console.warn('[RootLayout] setupApp error:', e);
    }
  }, []);

  useEffect(() => {
    setupApp();
  }, [setupApp]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        try {
          if (await needsReschedule()) {
            scheduleAllNotifications().catch(() => {});
          }
        } catch {}
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((_response) => {
      // TODO : naviguer vers la prise correspondante
    });
    return () => sub.remove();
  }, []);

  // Pendant le chargement des polices (~100-300 ms) : nom de l'app centré
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Text style={{ fontSize: 34, fontWeight: '700', color: '#4f46e5', letterSpacing: -0.5 }}>
          Fanafodiko
        </Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
    </Stack>
  );
}
