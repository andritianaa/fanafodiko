import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore, selectAppState } from '../store/useStore';
import { medSearchApi } from '../api/client';
import type { Pharmacy, PendingSearch } from '../types';
import type { PendingEntry } from '../../components/PendingSearchModal';

const POLL_INTERVAL_MS = 30_000;

interface UsePendingSearchesResult {
  entries: PendingEntry[];
  modalVisible: boolean;
  closeModal: () => void;
  respond: (searchId: string, pharmacyId: string, hasStock: boolean) => Promise<void>;
}

/**
 * Pour le staff : poll les demandes en attente sur chaque pharmacie gérée.
 * Expose l'état pour PendingSearchModal (plus d'Alert natif).
 */
export function usePendingSearches(myPharmacies: Pharmacy[]): UsePendingSearchesResult {
  const appState = useStore(selectAppState);
  const [entries, setEntries] = useState<PendingEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    if (!appState.isOnline || myPharmacies.length === 0) return;

    try {
      const results = await Promise.allSettled(
        myPharmacies.map((p) => medSearchApi.pharmacyPending(p.id)),
      );

      const newEntries: PendingEntry[] = [];

      results.forEach((result, index) => {
        if (result.status !== 'fulfilled') return;
        const pharmacy = myPharmacies[index];
        for (const search of result.value) {
          if (!knownIdsRef.current.has(search.searchId)) {
            knownIdsRef.current.add(search.searchId);
            newEntries.push({
              search,
              pharmacyId: pharmacy.id,
              pharmacyName: pharmacy.name,
            });
          }
        }
      });

      if (newEntries.length > 0) {
        setEntries((prev) => [...prev, ...newEntries]);
        setModalVisible(true);
      }
    } catch {
      // Ignore poll errors silently
    }
  }, [appState.isOnline, myPharmacies]);

  useEffect(() => {
    poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [poll]);

  const respond = useCallback(
    async (searchId: string, pharmacyId: string, hasStock: boolean) => {
      await medSearchApi.respond(searchId, pharmacyId, { hasStock });
      setEntries((prev) => {
        const next = prev.filter((e) => e.search.searchId !== searchId);
        if (next.length === 0) setModalVisible(false);
        return next;
      });
    },
    [],
  );

  const closeModal = useCallback(() => setModalVisible(false), []);

  return { entries, modalVisible, closeModal, respond };
}
