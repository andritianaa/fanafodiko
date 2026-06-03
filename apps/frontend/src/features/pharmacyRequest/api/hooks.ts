import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  submitPharmacyRequest,
  getPharmacyRequests,
  approveRequest,
  rejectRequest,
  reviewManagement,
  deleteRequest,
} from './fetchers';

export const useSubmitPharmacyRequest = () =>
  useMutation({ mutationFn: submitPharmacyRequest });

export const usePharmacyRequests = () =>
  useQuery({ queryKey: ['pharmacy-requests'], queryFn: getPharmacyRequests });

export const useApproveRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reqId: string) => approveRequest(reqId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pharmacy-requests'] });
      qc.invalidateQueries({ queryKey: ['backoffice', 'pharmacies'] });
    },
  });
};

export const useRejectRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reqId, reason }: { reqId: string; reason?: string }) =>
      rejectRequest(reqId, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pharmacy-requests'] }),
  });
};

export const useDeleteRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reqId: string) => deleteRequest(reqId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pharmacy-requests'] }),
  });
};

export const useReviewManagement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      reqId,
      decision,
    }: {
      reqId: string;
      decision: 'approve' | 'reject';
    }) => reviewManagement(reqId, decision),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pharmacy-requests'] }),
  });
};
