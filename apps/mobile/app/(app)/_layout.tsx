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
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="help" />
      <Stack.Screen name="member/[id]" />
      <Stack.Screen name="pharmacy/[id]" />
      <Stack.Screen name="med-search/[id]" />
      <Stack.Screen name="med-search/history" />
      <Stack.Screen name="my-pharmacy/index" />
      <Stack.Screen name="my-pharmacy/[id]" />
      <Stack.Screen name="suggest-pharmacy" />
    </Stack>
  );
}
