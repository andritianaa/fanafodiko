import { apiClient } from '@/api/client';
import type { BackofficeUsersResponse } from '@ext/schemas';

export const getBackofficeUsers = async (): Promise<BackofficeUsersResponse> => {
  const response = await apiClient.get<BackofficeUsersResponse>('/backoffice/users');
  return response.data;
};
