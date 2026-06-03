import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { submitBugReport, getBugReports, updateBugReport } from './fetchers';

export const useSubmitBugReport = () =>
  useMutation({ mutationFn: submitBugReport });

export const useBugReports = (status = 'all') =>
  useQuery({
    queryKey: ['bug-reports', status],
    queryFn: () => getBugReports(status),
  });

export const useUpdateBugReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateBugReport>[1] }) =>
      updateBugReport(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bug-reports'] }),
  });
};
