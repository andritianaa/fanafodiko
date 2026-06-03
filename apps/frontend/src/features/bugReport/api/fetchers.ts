import { apiClient } from '@/api/client';
import type { CreateBugReportInput, BugReport, UpdateBugReportInput } from '@ext/schemas';

export const submitBugReport = async (data: CreateBugReportInput): Promise<{ id: string }> => {
  const res = await apiClient.post<{ id: string }>('/bug-reports', data);
  return res.data;
};

export const getBugReports = async (status = 'all'): Promise<{ reports: BugReport[]; total: number }> => {
  const res = await apiClient.get<{ reports: BugReport[]; total: number }>('/backoffice/bug-reports', {
    params: { status },
  });
  return res.data;
};

export const updateBugReport = async (id: string, data: UpdateBugReportInput): Promise<void> => {
  await apiClient.patch(`/backoffice/bug-reports/${id}`, data);
};
