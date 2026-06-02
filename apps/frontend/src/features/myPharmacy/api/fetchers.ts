import { apiClient } from '@/api/client';
import type {
  MyPharmacy,
  Pharmacy,
  PharmacyMember,
  PharmacyRole,
  PharmacyInvitation,
  InviteMemberInput,
  UpdatePharmacyInfoInput,
  UpdatePharmacyHoursInput,
  CreateExceptionalScheduleInput,
  UpdateExceptionalScheduleInput,
  CreatePharmacyGuardInput,
  UpdatePharmacyGuardInput,
} from '@ext/schemas';

type MyPharmacyDetail = Pharmacy & { myRole: PharmacyRole };

export const getMyPharmacies = async (): Promise<MyPharmacy[]> => {
  const res = await apiClient.get<{ pharmacies: MyPharmacy[] }>('/my/pharmacies');
  return res.data.pharmacies;
};

export const getMyPharmacy = async (id: string): Promise<MyPharmacyDetail> => {
  const res = await apiClient.get<MyPharmacyDetail>(`/my/pharmacies/${id}`);
  return res.data;
};

export const updatePharmacyInfo = async (id: string, data: UpdatePharmacyInfoInput) => {
  const res = await apiClient.patch(`/my/pharmacies/${id}/info`, data);
  return res.data;
};

export const updatePharmacyHours = async (id: string, data: UpdatePharmacyHoursInput) => {
  const res = await apiClient.patch(`/my/pharmacies/${id}/hours`, data);
  return res.data;
};

export const updatePharmacyImages = async (id: string, images: string[]) => {
  const res = await apiClient.put(`/my/pharmacies/${id}/images`, { images });
  return res.data;
};

export const getPharmacyMembers = async (id: string): Promise<PharmacyMember[]> => {
  const res = await apiClient.get<{ members: PharmacyMember[] }>(
    `/my/pharmacies/${id}/members`
  );
  return res.data.members;
};

export const inviteMember = async (id: string, data: InviteMemberInput) => {
  const res = await apiClient.post(`/my/pharmacies/${id}/invitations`, data);
  return res.data;
};

export const removeMember = async (id: string, userId: string) => {
  const res = await apiClient.delete(`/my/pharmacies/${id}/members/${userId}`);
  return res.data;
};

export const updateMemberRole = async (
  id: string,
  userId: string,
  role: PharmacyRole
) => {
  const res = await apiClient.patch(`/my/pharmacies/${id}/members/${userId}/role`, {
    role,
  });
  return res.data;
};

// Invitations
export const getInvitation = async (token: string): Promise<PharmacyInvitation> => {
  const res = await apiClient.get<PharmacyInvitation>(
    `/pharmacy-invitations/${token}`
  );
  return res.data;
};

export const acceptInvitation = async (
  token: string
): Promise<{ pharmacyId: string }> => {
  const res = await apiClient.post<{ pharmacyId: string }>(
    `/pharmacy-invitations/${token}/accept`
  );
  return res.data;
};

export interface PharmacySearchHistoryItem {
  searchId: string;
  medicationName: string;
  radiusKm: number;
  note?: string;
  createdAt: string;
  hasStock: boolean | null;
  respondedAt: string | null;
}

export const getPharmacySearchHistory = async (id: string): Promise<PharmacySearchHistoryItem[]> => {
  const res = await apiClient.get<{ history: PharmacySearchHistoryItem[] }>(`/my/pharmacies/${id}/search-history`);
  return res.data.history;
};

// ─── Ouvertures / fermetures exceptionnelles ──────────────────────────────────

export const addExceptionalSchedule = async (
  id: string,
  data: CreateExceptionalScheduleInput
) => {
  const res = await apiClient.post(`/my/pharmacies/${id}/exceptional`, data);
  return res.data;
};

export const updateExceptionalSchedule = async (
  id: string,
  scheduleId: string,
  data: UpdateExceptionalScheduleInput
) => {
  const res = await apiClient.patch(
    `/my/pharmacies/${id}/exceptional/${scheduleId}`,
    data
  );
  return res.data;
};

export const deleteExceptionalSchedule = async (
  id: string,
  scheduleId: string
) => {
  const res = await apiClient.delete(
    `/my/pharmacies/${id}/exceptional/${scheduleId}`
  );
  return res.data;
};

// ─── Gardes déclarées par la pharmacie ────────────────────────────────────────

export const addPharmacyGuard = async (
  id: string,
  data: CreatePharmacyGuardInput
) => {
  const res = await apiClient.post(`/my/pharmacies/${id}/guards`, data);
  return res.data;
};

export const updatePharmacyGuard = async (
  id: string,
  guardId: string,
  data: UpdatePharmacyGuardInput
) => {
  const res = await apiClient.patch(
    `/my/pharmacies/${id}/guards/${guardId}`,
    data
  );
  return res.data;
};

export const deletePharmacyGuard = async (id: string, guardId: string) => {
  const res = await apiClient.delete(`/my/pharmacies/${id}/guards/${guardId}`);
  return res.data;
};

export type { MyPharmacyDetail };
