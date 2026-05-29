import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { medicationFetchers } from './fetchers';
import type { CreateMedicationInput, UpdateMedicationInput } from '../types';

export const useMedications = (profileId: string) => {
  return useQuery({
    queryKey: ['medications', profileId],
    queryFn: () => medicationFetchers.listByProfile(profileId),
    enabled: !!profileId,
  });
};

export const useMedicationDetails = (id: string) => {
  return useQuery({
    queryKey: ['medication', id],
    queryFn: () => medicationFetchers.getDetails(id),
    enabled: !!id,
  });
};

export const useCreateMedication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMedicationInput) => medicationFetchers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['planning'] });
    },
  });
};

export const useUpdateMedication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMedicationInput }) =>
      medicationFetchers.update(id, data),
    onSuccess: (updatedMed) => {
      queryClient.invalidateQueries({ queryKey: ['medication', updatedMed.id] });
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['planning'] });
    },
  });
};

export const useToggleMedicationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      medicationFetchers.toggleStatus(id, isActive),
    onSuccess: (updatedMed) => {
      queryClient.invalidateQueries({ queryKey: ['medication', updatedMed.id] });
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['planning'] });
    },
  });
};

export const useRemoveMedication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => medicationFetchers.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['planning'] });
    },
  });
};
