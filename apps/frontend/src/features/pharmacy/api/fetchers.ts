import { apiClient } from '@/api/client';
import type {
  PharmacyListResponseSchema,
  PharmacySearchResponseSchema,
  CreatePharmacyInput,
  UpdatePharmacyInput,
  BatchGuardInput,
} from '@ext/schemas';
import { z } from 'zod';
import {
  PharmacyListResponseSchema as ListSchema,
  PharmacySearchResponseSchema as SearchSchema,
} from '@ext/schemas';

type ListResponse = z.infer<typeof ListSchema>;
type SearchResponse = z.infer<typeof SearchSchema>;

export type PharmacyFilter = 'open' | 'guard' | '24h' | undefined;

export const getPharmacies = async (filter?: PharmacyFilter): Promise<ListResponse> => {
  const params = filter ? { filter } : {};
  const res = await apiClient.get<ListResponse>('/pharmacies', { params });
  return res.data;
};

export const searchPharmacies = async (q: string): Promise<SearchResponse> => {
  const res = await apiClient.get<SearchResponse>('/pharmacies/search', { params: { q } });
  return res.data;
};

// Backoffice
export const getBackofficePharmacies = async (): Promise<ListResponse> => {
  const res = await apiClient.get<ListResponse>('/backoffice/pharmacies');
  return res.data;
};

export const createPharmacy = async (data: CreatePharmacyInput) => {
  const res = await apiClient.post('/backoffice/pharmacies', data);
  return res.data;
};

export const updatePharmacy = async (id: string, data: UpdatePharmacyInput) => {
  const res = await apiClient.put(`/backoffice/pharmacies/${id}`, data);
  return res.data;
};

export const batchUpdateGuard = async (data: BatchGuardInput) => {
  const res = await apiClient.post('/backoffice/pharmacies/guard/batch', data);
  return res.data;
};

export const toggleGuard = async (id: string, weekIdentifier: string, isActive: boolean) => {
  const res = await apiClient.patch(`/backoffice/pharmacies/${id}/guard`, {
    weekIdentifier,
    isActive,
  });
  return res.data;
};

export const deletePharmacy = async (id: string) => {
  const res = await apiClient.delete(`/backoffice/pharmacies/${id}`);
  return res.data;
};

export const assignPharmacyOwner = async (id: string, email: string) => {
  const res = await apiClient.post(`/backoffice/pharmacies/${id}/owner`, { email });
  return res.data;
};
