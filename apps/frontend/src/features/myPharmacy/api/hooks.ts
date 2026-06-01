import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyPharmacies,
  getMyPharmacy,
  updatePharmacyInfo,
  updatePharmacyHours,
  updatePharmacyImages,
  getPharmacyMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
  getInvitation,
  acceptInvitation,
  getPharmacySearchHistory,
} from './fetchers';
import type {
  InviteMemberInput,
  PharmacyRole,
  UpdatePharmacyInfoInput,
  UpdatePharmacyHoursInput,
} from '@ext/schemas';

export const useMyPharmacies = () =>
  useQuery({ queryKey: ['my-pharmacies'], queryFn: getMyPharmacies });

export const useMyPharmacy = (id: string) =>
  useQuery({
    queryKey: ['my-pharmacy', id],
    queryFn: () => getMyPharmacy(id),
    enabled: !!id,
  });

export const usePharmacyMembers = (id: string) =>
  useQuery({
    queryKey: ['my-pharmacy', id, 'members'],
    queryFn: () => getPharmacyMembers(id),
    enabled: !!id,
  });

export const useUpdatePharmacyInfo = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePharmacyInfoInput) => updatePharmacyInfo(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-pharmacy', id] }),
  });
};

export const useUpdatePharmacyHours = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePharmacyHoursInput) => updatePharmacyHours(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-pharmacy', id] }),
  });
};

export const useUpdatePharmacyImages = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (images: string[]) => updatePharmacyImages(id, images),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-pharmacy', id] }),
  });
};

export const useInviteMember = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InviteMemberInput) => inviteMember(id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['my-pharmacy', id, 'members'] }),
  });
};

export const useRemoveMember = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeMember(id, userId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['my-pharmacy', id, 'members'] }),
  });
};

export const useUpdateMemberRole = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: PharmacyRole }) =>
      updateMemberRole(id, userId, role),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['my-pharmacy', id, 'members'] }),
  });
};

export const useInvitation = (token: string) =>
  useQuery({
    queryKey: ['invitation', token],
    queryFn: () => getInvitation(token),
    enabled: !!token,
    retry: false,
  });

export const usePharmacySearchHistory = (id: string) =>
  useQuery({
    queryKey: ['pharmacy-search-history', id],
    queryFn: () => getPharmacySearchHistory(id),
    enabled: !!id,
  });

export const useAcceptInvitation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => acceptInvitation(token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-pharmacies'] }),
  });
};
