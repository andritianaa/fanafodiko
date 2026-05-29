import React, { useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import {
  setupNotificationChannel,
  requestNotificationPermissions,
  registerBackgroundTask,
  startBackgroundScheduling,
  needsReschedule,
  scheduleAllNotifications,
} from '../src/notifications/scheduler';
import { loadFromLocal } from '../src/sync/syncService';
import { useStore } from '../src/store/useStore';
import { IS_EXPO_GO } from '../src/config/env';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const token = useStore((s) => s.token);

  const setupApp = useCallback(async () => {
    try {
      // Canal Android (no-op en mode Expo Go / iOS)
      if (Platform.OS === 'android') {
        await setupNotificationChannel();
      }

      const hasPermission = await requestNotificationPermissions();

      // Background task — ignoré silencieusement en mode Expo Go
      registerBackgroundTask();
      if (hasPermission && !IS_EXPO_GO) {
        await startBackgroundScheduling();
      }

      // SQLite — disponible dans Expo Go et les builds natifs
      await loadFromLocal();

      // Planification des notifications (fonctionne dans Expo Go)
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
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        medicationId?: string;
        scheduledAt?: string;
      };
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
    </Stack>
  );
}
