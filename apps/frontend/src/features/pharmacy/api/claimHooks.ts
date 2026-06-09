import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  submitPharmacyClaim,
  getBackofficeClaims,
  approveClaim,
  rejectClaim,
} from './claimFetchers';
import type { CreatePharmacyClaimInput } from '@ext/schemas';

export const useSubmitClaim = () => {
  return useMutation({
    mutationFn: (data: CreatePharmacyClaimInput) => submitPharmacyClaim(data),
  });
};

export const useBackofficeClaims = () =>
  useQuery({
    queryKey: ['backoffice', 'pharmacy-claims'],
    queryFn: getBackofficeClaims,
  });

export const useApproveClaim = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (claimId: string) => approveClaim(claimId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backoffice', 'pharmacy-claims'] }),
  });
};

export const useRejectClaim = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ claimId, reason }: { claimId: string; reason?: string }) =>
      rejectClaim(claimId, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backoffice', 'pharmacy-claims'] }),
  });
};
