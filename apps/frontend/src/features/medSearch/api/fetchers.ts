import { apiClient } from '@/api/client';
import type { CreateMedSearchInput } from '@ext/schemas';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface MedSearchCreated {
  id: string;
  nearbyCount: number;
  expiresAt: string;
}

export interface MedSearchDetail {
  id: string;
  medicationName: string;
  coordinates: { lat: number; lng: number };
  radiusKm: number;
  note?: string;
  status: 'active' | 'closed';
  nearbyPharmacies: { id: string; name: string; distance: number; coordinates: { lat: number; lng: number } }[];
  responses: MedSearchResponseItem[];
  expiresAt: string;
  createdAt: string;
}

export interface MedSearchResponseItem {
  pharmacyId: string;
  pharmacyName: string;
  hasStock: boolean;
  note?: string;
  distance?: number;
  respondedAt: string;
}

export const createMedSearch = async (data: CreateMedSearchInput): Promise<MedSearchCreated> => {
  const res = await apiClient.post<MedSearchCreated>('/med-searches', data);
  return res.data;
};

export const getMedSearch = async (id: string): Promise<MedSearchDetail> => {
  const res = await apiClient.get<MedSearchDetail>(`/med-searches/${id}`);
  return res.data;
};

export const respondToSearch = async (
  searchId: string,
  pharmacyId: string,
  data: { hasStock: boolean; note?: string }
) => {
  const res = await apiClient.post(`/med-searches/${searchId}/respond/${pharmacyId}`, data);
  return res.data;
};

export interface UserSearchHistoryItem {
  id: string;
  medicationName: string;
  radiusKm: number;
  note?: string;
  status: 'active' | 'closed';
  createdAt: string;
  expiresAt: string;
  nearbyCount: number;
  respondedCount: number;
  hasAvailable: boolean;
}

export const getMySearchHistory = async (): Promise<UserSearchHistoryItem[]> => {
  const res = await apiClient.get<{ history: UserSearchHistoryItem[] }>('/med-searches/my');
  return res.data.history;
};

export interface PharmacyPendingSearch {
  searchId: string;
  medicationName: string;
  note?: string;
  radiusKm: number;
  createdAt: string;
}

export const getPharmacyPendingSearches = async (pharmacyId: string): Promise<PharmacyPendingSearch[]> => {
  const res = await apiClient.get<PharmacyPendingSearch[]>(`/med-searches/pharmacy/${pharmacyId}/pending`);
  return res.data;
};

/** Returns the SSE URL for a search (uses native EventSource with credentials). */
export const getMedSearchStreamUrl = (searchId: string) =>
  `${BASE}/med-searches/${searchId}/stream`;

/** Returns the SSE URL for pharmacy staff notifications. */
export const getPharmacySearchStreamUrl = (pharmacyId: string) =>
  `${BASE}/med-searches/pharmacy-stream/${pharmacyId}`;
