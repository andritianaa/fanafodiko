import React, { useEffect, useCallback } from 'react';
import { Stack, router } from 'expo-router';
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

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    FunnelDisplay_300Light:    require('../assets/fonts/Funnel_Display-Light.ttf'),
    FunnelDisplay_400Regular:  require('../assets/fonts/Funnel_Display-Regular.ttf'),
    FunnelDisplay_500Medium:   require('../assets/fonts/Funnel_Display-Medium.ttf'),
    FunnelDisplay_600SemiBold: require('../assets/fonts/Funnel_Display-SemiBold.ttf'),
    FunnelDisplay_700Bold:     require('../assets/fonts/Funnel_Display-Bold.ttf'),
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

      // Cold start : si l'app a été ouverte depuis une notification
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse) {
        handleNotificationNavigation(lastResponse.notification.request.content.data);
      }
    } catch (e) {
      if (__DEV__) console.warn('[RootLayout] setupApp error:', e);
    }
  }, []);

  useEffect(() => {
    setupApp();
  }, [setupApp]);

  // Re-planifie au retour au premier plan
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

  // Tap sur une notification (foreground ou background)
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationNavigation(response.notification.request.content.data);
    });
    return () => sub.remove();
  }, []);

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

/**
 * Navigation au tap d'une notification de médicament.
 *
 * Si on a un profileId → détail du membre (liste des médicaments + prises).
 * Sinon → dashboard (vue des prises du jour).
 *
 * Le `setTimeout` laisse le temps au navigateur de s'initialiser
 * en cas de cold start.
 */
function handleNotificationNavigation(data: Record<string, unknown>) {
  const profileId = data?.profileId as string | undefined;

  setTimeout(() => {
    try {
      if (profileId) {
        // Navigue vers le détail du membre concerné
        router.push({ pathname: '/(app)/member/[id]', params: { id: profileId } });
      } else {
        // Fallback → dashboard (prises du jour)
        router.navigate('/(app)/(tabs)/');
      }
    } catch {
      // Navigateur pas encore prêt (cold start extrême), ignoré
    }
  }, 300);
}
