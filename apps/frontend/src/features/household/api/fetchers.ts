import { apiClient } from '@/api/client';
import type {
  HouseholdMember,
  CreateHouseholdMemberInput,
  UpdateHouseholdMemberInput,
  HouseholdMemberList,
} from '../types';

export const getHouseholdMembers = async (): Promise<HouseholdMemberList> => {
  const response = await apiClient.get<HouseholdMemberList>('/household');
  return response.data;
};

export const addHouseholdMember = async (data: CreateHouseholdMemberInput): Promise<HouseholdMember> => {
  const response = await apiClient.post<HouseholdMember>('/household', data);
  return response.data;
};

export const getHouseholdMember = async (id: string): Promise<HouseholdMember> => {
  const response = await apiClient.get<HouseholdMember>(`/household/${id}`);
  return response.data;
};

export const updateHouseholdMember = async ({ id, data }: { id: string; data: UpdateHouseholdMemberInput }): Promise<HouseholdMember> => {
  const response = await apiClient.patch<HouseholdMember>(`/household/${id}`, data);
  return response.data;
};

export const removeHouseholdMember = async (id: string): Promise<void> => {
  await apiClient.delete(`/household/${id}`);
};
