import React, { useEffect, useRef } from 'react';
import { Stack, Redirect } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { fullSync } from '../../src/sync/syncService';
import { useNetworkMonitor } from '../../src/hooks/useNetwork';

export default function AppLayout() {
  const token = useStore((s) => s.token);
  const syncedRef = useRef(false);

  useNetworkMonitor();

  useEffect(() => {
    if (token && !syncedRef.current) {
      syncedRef.current = true;
      fullSync().catch(() => {});
    }
  }, [token]);

  if (!token) return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="member/[id]"
        options={{ animation: 'slide_from_right' }}
      />
    </Stack>
  );
}
