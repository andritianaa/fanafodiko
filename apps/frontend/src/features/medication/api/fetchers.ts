import { apiClient } from '@/api/client';
import type {
  CreateMedicationInput,
  UpdateMedicationInput,
  Medication,
  MedicationList,
} from '../types';

export const medicationFetchers = {
  create: async (data: CreateMedicationInput): Promise<Medication> => {
    const response = await apiClient.post<Medication>('/medications', data);
    return response.data;
  },

  listByProfile: async (profileId: string): Promise<MedicationList> => {
    const response = await apiClient.get<MedicationList>(`/medications/profile/${profileId}`);
    return response.data;
  },

  getDetails: async (id: string): Promise<Medication> => {
    const response = await apiClient.get<Medication>(`/medications/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateMedicationInput): Promise<Medication> => {
    const response = await apiClient.put<Medication>(`/medications/${id}`, data);
    return response.data;
  },

  toggleStatus: async (id: string, isActive: boolean): Promise<Medication> => {
    const response = await apiClient.patch<Medication>(`/medications/${id}/status`, { isActive });
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/medications/${id}`);
  },
};
