import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPharmacies,
  searchPharmacies,
  getBackofficePharmacies,
  getBackofficePharmacy,
  createPharmacy,
  updatePharmacy,
  deletePharmacy,
  assignPharmacyOwner,
  batchUpdateGuard,
  toggleGuard,
  type PharmacyFilter,
} from './fetchers';
import type { CreatePharmacyInput, UpdatePharmacyInput, BatchGuardInput } from '@ext/schemas';

export const usePharmacies = (filter?: PharmacyFilter) =>
  useQuery({
    queryKey: ['pharmacies', filter],
    queryFn: () => getPharmacies(filter),
  });

export const usePharmacySearch = (q: string) =>
  useQuery({
    queryKey: ['pharmacies', 'search', q],
    queryFn: () => searchPharmacies(q),
    enabled: q.length >= 2,
  });

export const useBackofficePharmacies = () =>
  useQuery({
    queryKey: ['backoffice', 'pharmacies'],
    queryFn: getBackofficePharmacies,
  });

export const useBackofficePharmacy = (id: string) =>
  useQuery({
    queryKey: ['backoffice', 'pharmacies', id],
    queryFn: () => getBackofficePharmacy(id),
    enabled: !!id,
  });

export const useCreatePharmacy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPharmacy,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backoffice', 'pharmacies'] }),
  });
};

export const useUpdatePharmacy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePharmacyInput }) =>
      updatePharmacy(id, data),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['backoffice', 'pharmacies'] });
      qc.invalidateQueries({ queryKey: ['backoffice', 'pharmacies', id] });
    },
  });
};

export const useDeletePharmacy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePharmacy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backoffice', 'pharmacies'] }),
  });
};

export const useAssignPharmacyOwner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) =>
      assignPharmacyOwner(id, email),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backoffice', 'pharmacies'] }),
  });
};

export const useBatchUpdateGuard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BatchGuardInput) => batchUpdateGuard(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backoffice', 'pharmacies'] });
      qc.invalidateQueries({ queryKey: ['pharmacies'] });
    },
  });
};

export const useToggleGuard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      weekIdentifier,
      isActive,
    }: {
      id: string;
      weekIdentifier: string;
      isActive: boolean;
    }) => toggleGuard(id, weekIdentifier, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backoffice', 'pharmacies'] });
      qc.invalidateQueries({ queryKey: ['pharmacies'] });
    },
  });
};
