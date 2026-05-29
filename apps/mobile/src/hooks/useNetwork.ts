import { useEffect, useCallback } from 'react';
import * as Network from 'expo-network';
import { useStore } from '../store/useStore';

export function useNetworkMonitor(): void {
  const setOnline = useStore((s) => s.setOnline);

  const checkNetwork = useCallback(async () => {
    const state = await Network.getNetworkStateAsync();
    const online = !!(state.isConnected && state.isInternetReachable);
    setOnline(online);
  }, [setOnline]);

  useEffect(() => {
    checkNetwork();
    const interval = setInterval(checkNetwork, 10000);
    return () => clearInterval(interval);
  }, [checkNetwork]);
}

export async function getIsOnline(): Promise<boolean> {
  const state = await Network.getNetworkStateAsync();
  return !!(state.isConnected && state.isInternetReachable);
}
