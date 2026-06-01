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

export type { MyPharmacyDetail };
