import React, { useEffect, useCallback } from 'react';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { AppState, Platform, View, Text } from 'react-native';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setupNotificationChannel,
  requestNotificationPermissions,
  registerBackgroundTask,
  startBackgroundScheduling,
  needsReschedule,
  scheduleAllNotifications,
} from '../src/notifications/scheduler';
import { loadFromLocal } from '../src/sync/syncService';
import { authApi } from '../src/api/client';
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

      // Enregistrer le push token Expo (fire-and-forget)
      if (hasPermission && !IS_EXPO_GO) {
        registerExpoPushToken().catch(() => {});
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
        <Text style={{ fontSize: 34, fontWeight: '700', color: '#18181b', letterSpacing: -0.5 }}>
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

async function registerExpoPushToken(): Promise<void> {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    await AsyncStorage.setItem('expo_push_token', token);
    await authApi.registerPushToken(token);
  } catch {
    // Ignore, push token registration is best-effort
  }
}

function handleNotificationNavigation(data: Record<string, unknown>) {
  const type = data?.type as string | undefined;
  const profileId = data?.profileId as string | undefined;
  const searchId = data?.searchId as string | undefined;
  const pharmacyId = data?.pharmacyId as string | undefined;

  setTimeout(() => {
    try {
      if (type === 'search_response' && searchId) {
        router.push({ pathname: '/(app)/med-search/[id]', params: { id: searchId } });
      } else if (type === 'new_med_search' && pharmacyId) {
        router.push({ pathname: '/(app)/my-pharmacy/[id]', params: { id: pharmacyId } });
      } else if (profileId) {
        router.push({ pathname: '/(app)/member/[id]', params: { id: profileId } });
      } else {
        router.navigate('/(app)/(tabs)/');
      }
    } catch {
      // Navigateur pas encore prêt (cold start extrême), ignoré
    }
  }, 300);
}
