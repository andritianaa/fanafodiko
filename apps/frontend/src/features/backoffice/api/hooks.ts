import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBackofficeUsers,
  getPharmacyStaff,
  backofficeRemoveMember,
  backofficeUpdateMemberRole,
  backofficeAddExceptionalSchedule,
  backofficeUpdateExceptionalSchedule,
  backofficeDeleteExceptionalSchedule,
  backofficeAddPharmacyGuard,
  backofficeUpdatePharmacyGuard,
  backofficeDeletePharmacyGuard,
} from './fetchers';
import type {
  PharmacyRole,
  CreateExceptionalScheduleInput,
  UpdateExceptionalScheduleInput,
  CreatePharmacyGuardInput,
  UpdatePharmacyGuardInput,
} from '@ext/schemas';

export const useBackofficeUsers = () => {
  return useQuery({
    queryKey: ['backoffice', 'users'],
    queryFn: getBackofficeUsers,
  });
};

export const usePharmacyStaff = (pharmacyId: string) =>
  useQuery({
    queryKey: ['backoffice', 'pharmacy-staff', pharmacyId],
    queryFn: () => getPharmacyStaff(pharmacyId),
    enabled: !!pharmacyId,
  });

export const useBackofficeRemoveMember = (pharmacyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => backofficeRemoveMember(pharmacyId, userId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['backoffice', 'pharmacy-staff', pharmacyId] }),
  });
};

export const useBackofficeUpdateMemberRole = (pharmacyId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: PharmacyRole }) =>
      backofficeUpdateMemberRole(pharmacyId, userId, role),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['backoffice', 'pharmacy-staff', pharmacyId] }),
  });
};

// ─── Exceptions d'horaires (admin bypass) ─────────────────────────────────────

const invalidatePharmacy = (qc: ReturnType<typeof useQueryClient>, id: string) => {
  qc.invalidateQueries({ queryKey: ['backoffice', 'pharmacies', id] });
  qc.invalidateQueries({ queryKey: ['backoffice', 'pharmacies'] });
};

export const useBackofficeAddExceptionalSchedule = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExceptionalScheduleInput) =>
      backofficeAddExceptionalSchedule(id, data),
    onSuccess: () => invalidatePharmacy(qc, id),
  });
};

export const useBackofficeUpdateExceptionalSchedule = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, data }: { scheduleId: string; data: UpdateExceptionalScheduleInput }) =>
      backofficeUpdateExceptionalSchedule(id, scheduleId, data),
    onSuccess: () => invalidatePharmacy(qc, id),
  });
};

export const useBackofficeDeleteExceptionalSchedule = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (scheduleId: string) =>
      backofficeDeleteExceptionalSchedule(id, scheduleId),
    onSuccess: () => invalidatePharmacy(qc, id),
  });
};

// ─── Gardes pharmacie (admin bypass) ──────────────────────────────────────────

export const useBackofficeAddPharmacyGuard = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePharmacyGuardInput) => backofficeAddPharmacyGuard(id, data),
    onSuccess: () => invalidatePharmacy(qc, id),
  });
};

export const useBackofficeUpdatePharmacyGuard = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ guardId, data }: { guardId: string; data: UpdatePharmacyGuardInput }) =>
      backofficeUpdatePharmacyGuard(id, guardId, data),
    onSuccess: () => invalidatePharmacy(qc, id),
  });
};

export const useBackofficeDeletePharmacyGuard = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guardId: string) => backofficeDeletePharmacyGuard(id, guardId),
    onSuccess: () => invalidatePharmacy(qc, id),
  });
};
