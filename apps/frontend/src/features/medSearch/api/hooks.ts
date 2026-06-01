import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMedSearch,
  getMedSearch,
  respondToSearch,
  getPharmacyPendingSearches,
  getMySearchHistory,
  getMedSearchStreamUrl,
  type MedSearchResponseItem,
  type MedSearchDetail,
} from './fetchers';
import type { CreateMedSearchInput } from '@ext/schemas';

export const useCreateMedSearch = () =>
  useMutation({ mutationFn: createMedSearch });

export const useMedSearch = (id: string) =>
  useQuery({ queryKey: ['med-search', id], queryFn: () => getMedSearch(id), refetchInterval: false });

export const useRespondToSearch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ searchId, pharmacyId, data }: { searchId: string; pharmacyId: string; data: { hasStock: boolean; note?: string } }) =>
      respondToSearch(searchId, pharmacyId, data),
    onSuccess: (_, { searchId }) => qc.invalidateQueries({ queryKey: ['med-search', searchId] }),
  });
};

/** SSE hook: subscribes to real-time responses for a search. */
export function useMedSearchStream(searchId: string | null) {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [lastResponse, setLastResponse] = useState<MedSearchResponseItem | null>(null);

  useEffect(() => {
    if (!searchId) return;
    const url = getMedSearchStreamUrl(searchId);
    const source = new EventSource(url, { withCredentials: true });

    source.addEventListener('connected', () => setConnected(true));
    source.addEventListener('ping', () => {});
    source.addEventListener('response', (e) => {
      try {
        const data: MedSearchResponseItem = JSON.parse(e.data);
        setLastResponse(data);
        // Merge into query cache
        qc.setQueryData<MedSearchDetail>(['med-search', searchId], (old) => {
          if (!old) return old;
          const filtered = old.responses.filter((r) => r.pharmacyId !== data.pharmacyId);
          return { ...old, responses: [...filtered, data] };
        });
      } catch {}
    });

    source.onerror = () => setConnected(false);
    return () => { source.close(); setConnected(false); };
  }, [searchId, qc]);

  return { connected, lastResponse };
}

export const useMySearchHistory = () =>
  useQuery({
    queryKey: ['my-search-history'],
    queryFn: getMySearchHistory,
  });

/** Polling hook for pharmacy staff: fetches pending searches every 30 s. */
export function usePharmacyPendingSearches(pharmacyId: string | null) {
  return useQuery({
    queryKey: ['pharmacy-pending-searches', pharmacyId],
    queryFn: () => getPharmacyPendingSearches(pharmacyId!),
    enabled: !!pharmacyId,
    refetchInterval: 30_000,
    staleTime: 0,
  });
}
