import { apiClient } from '@/api/client';
import type { CreatePharmacyClaimInput } from '@ext/schemas';
import { PharmacyClaimsResponseSchema } from '@ext/schemas';
import { z } from 'zod';

type ClaimsResponse = z.infer<typeof PharmacyClaimsResponseSchema>;

export const submitPharmacyClaim = async (data: CreatePharmacyClaimInput) => {
  const res = await apiClient.post<{ id: string }>('/pharmacy-claims', data);
  return res.data;
};

export const getBackofficeClaims = async (): Promise<ClaimsResponse> => {
  const res = await apiClient.get<ClaimsResponse>('/backoffice/pharmacy-claims');
  return res.data;
};

export const approveClaim = async (claimId: string) => {
  const res = await apiClient.post(`/backoffice/pharmacy-claims/${claimId}/approve`);
  return res.data;
};

export const rejectClaim = async (claimId: string, reason?: string) => {
  const res = await apiClient.post(`/backoffice/pharmacy-claims/${claimId}/reject`, { reason });
  return res.data;
};
