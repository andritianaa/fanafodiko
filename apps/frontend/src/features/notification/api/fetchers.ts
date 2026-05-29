import { apiClient } from '@/api/client';
import type {
  TaskList,
  DailyProgress,
  InAppNotificationList,
  UnreadCount,
} from '../types';

export const getTasks = async ({ profileId, date, from, to }: { profileId?: string; date?: string; from?: string; to?: string }): Promise<TaskList> => {
  const params = new URLSearchParams();
  if (profileId) params.append('profileId', profileId);
  if (date) params.append('date', date);
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  const response = await apiClient.get<TaskList>(`/notifications/tasks?${params.toString()}`);
  return response.data;
};

export const markTaskTaken = async (taskId: string): Promise<void> => {
  await apiClient.patch(`/notifications/tasks/${taskId}/take`);
};

export const markTaskSkipped = async (taskId: string): Promise<void> => {
  await apiClient.patch(`/notifications/tasks/${taskId}/skip`);
};

export const getDailyProgress = async ({ profileId, date }: { profileId?: string; date?: string }): Promise<DailyProgress> => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    const id = profileId || 'all';
  const response = await apiClient.get<DailyProgress>(`/notifications/tasks/stats/${id}?${params.toString()}`);
  return response.data;
};

export const getUnreadNotifications = async (profileId: string): Promise<InAppNotificationList> => {
  const response = await apiClient.get<InAppNotificationList>(`/notifications/in-app/${profileId}`);
  return response.data;
};

export const getUnreadNotificationCount = async (profileId: string): Promise<UnreadCount> => {
  const response = await apiClient.get<UnreadCount>(`/notifications/in-app/${profileId}/count`);
  return response.data;
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  await apiClient.patch(`/notifications/in-app/${notificationId}/read`);
};

export const markAllNotificationsRead = async (profileId: string): Promise<void> => {
  await apiClient.patch(`/notifications/in-app/${profileId}/read-all`);
};
