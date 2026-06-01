import { apiClient } from '@/api/client';
import type {
  CreatePharmacyRequestInput,
  PharmacyRequest,
} from '@ext/schemas';

export const submitPharmacyRequest = async (
  data: CreatePharmacyRequestInput
): Promise<{ id: string }> => {
  const res = await apiClient.post<{ id: string }>('/pharmacy-requests', data);
  return res.data;
};

export const getPharmacyRequests = async (): Promise<{
  requests: PharmacyRequest[];
  total: number;
}> => {
  const res = await apiClient.get('/backoffice/pharmacies/requests');
  return res.data;
};

export const approveRequest = async (reqId: string) => {
  const res = await apiClient.post(`/backoffice/pharmacies/requests/${reqId}/approve`);
  return res.data;
};

export const rejectRequest = async (reqId: string, reason?: string) => {
  const res = await apiClient.post(
    `/backoffice/pharmacies/requests/${reqId}/reject`,
    { reason }
  );
  return res.data;
};

export const reviewManagement = async (
  reqId: string,
  decision: 'approve' | 'reject'
) => {
  const res = await apiClient.post(
    `/backoffice/pharmacies/requests/${reqId}/management/${decision}`
  );
  return res.data;
};
