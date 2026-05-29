import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getTasks,
  markTaskTaken,
  markTaskSkipped,
  getDailyProgress,
  getUnreadNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from './fetchers';

export const useTasks = ({ profileId, date, from, to }: { profileId?: string; date?: string; from?: string; to?: string }) => {
    return useQuery({
        queryKey: ['tasks', profileId, date, from, to],
        queryFn: () => getTasks({ profileId, date, from, to }),
        enabled: true, 
    });
};

export const useMarkTaskTaken = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: markTaskTaken,
        onSuccess: (_data, _taskId) => {
             // Invalidate tasks and progress
             queryClient.invalidateQueries({ queryKey: ['tasks'] });
             queryClient.invalidateQueries({ queryKey: ['dailyProgress'] });
        },
    });
};

export const useMarkTaskSkipped = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: markTaskSkipped,
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['tasks'] });
             queryClient.invalidateQueries({ queryKey: ['dailyProgress'] });
        },
    });
};

export const useDailyProgress = ({ profileId, date }: { profileId?: string; date?: string }) => {
    return useQuery({
        queryKey: ['dailyProgress', profileId, date],
        queryFn: () => getDailyProgress({ profileId, date }),
        enabled: true,
    });
};

export const useUnreadNotifications = (profileId: string) => {
    return useQuery({
        queryKey: ['notifications', profileId],
        queryFn: () => getUnreadNotifications(profileId),
        enabled: !!profileId,
        refetchInterval: 30000, // Poll evry 30s
    });
};

export const useUnreadNotificationCount = (profileId: string) => {
    return useQuery({
        queryKey: ['notificationsCount', profileId],
        queryFn: () => getUnreadNotificationCount(profileId),
        enabled: !!profileId,
         refetchInterval: 30000, // Poll every 30s
    });
};

export const useMarkNotificationRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: markNotificationRead,
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['notifications'] });
             queryClient.invalidateQueries({ queryKey: ['notificationsCount'] });
        },
    });
};

export const useMarkAllNotificationsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: markAllNotificationsRead,
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['notifications'] });
             queryClient.invalidateQueries({ queryKey: ['notificationsCount'] });
        },
    });
};
