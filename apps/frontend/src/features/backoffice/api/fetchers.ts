import { apiClient } from '@/api/client';
import type {
  BackofficeUsersResponse,
  PharmacyMember,
  PharmacyRole,
  CreateExceptionalScheduleInput,
  UpdateExceptionalScheduleInput,
  CreatePharmacyGuardInput,
  UpdatePharmacyGuardInput,
} from '@ext/schemas';

export const getBackofficeUsers = async (): Promise<BackofficeUsersResponse> => {
  const response = await apiClient.get<BackofficeUsersResponse>('/backoffice/users');
  return response.data;
};

// ─── Staff des pharmacies (admin app) ─────────────────────────────────────────

export const getPharmacyStaff = async (pharmacyId: string): Promise<PharmacyMember[]> => {
  const res = await apiClient.get<{ members: PharmacyMember[] }>(
    `/backoffice/pharmacies/${pharmacyId}/members`
  );
  return res.data.members;
};

export const backofficeRemoveMember = async (
  pharmacyId: string,
  userId: string
) => {
  const res = await apiClient.delete(
    `/backoffice/pharmacies/${pharmacyId}/members/${userId}`
  );
  return res.data;
};

export const backofficeUpdateMemberRole = async (
  pharmacyId: string,
  userId: string,
  role: PharmacyRole
) => {
  const res = await apiClient.patch(
    `/backoffice/pharmacies/${pharmacyId}/members/${userId}/role`,
    { role }
  );
  return res.data;
};

// ─── Exceptions d'horaires (admin bypass) ─────────────────────────────────────

export const backofficeAddExceptionalSchedule = async (
  id: string,
  data: CreateExceptionalScheduleInput
) => {
  const res = await apiClient.post(`/backoffice/pharmacies/${id}/exceptional`, data);
  return res.data;
};

export const backofficeUpdateExceptionalSchedule = async (
  id: string,
  scheduleId: string,
  data: UpdateExceptionalScheduleInput
) => {
  const res = await apiClient.patch(
    `/backoffice/pharmacies/${id}/exceptional/${scheduleId}`,
    data
  );
  return res.data;
};

export const backofficeDeleteExceptionalSchedule = async (
  id: string,
  scheduleId: string
) => {
  const res = await apiClient.delete(
    `/backoffice/pharmacies/${id}/exceptional/${scheduleId}`
  );
  return res.data;
};

// ─── Gardes pharmacie (admin bypass) ──────────────────────────────────────────

export const backofficeAddPharmacyGuard = async (
  id: string,
  data: CreatePharmacyGuardInput
) => {
  const res = await apiClient.post(`/backoffice/pharmacies/${id}/guards`, data);
  return res.data;
};

export const backofficeUpdatePharmacyGuard = async (
  id: string,
  guardId: string,
  data: UpdatePharmacyGuardInput
) => {
  const res = await apiClient.patch(
    `/backoffice/pharmacies/${id}/guards/${guardId}`,
    data
  );
  return res.data;
};

export const backofficeDeletePharmacyGuard = async (id: string, guardId: string) => {
  const res = await apiClient.delete(
    `/backoffice/pharmacies/${id}/guards/${guardId}`
  );
  return res.data;
};
