import { z } from 'zod';
import {
  TaskListResponseSchema,
  TaskResponseSchema,
  DailyProgressResponseSchema,
  InAppNotificationListSchema,
  UnreadCountSchema,
  InAppNotificationSchema,
} from '@ext/schemas';

export type Task = z.infer<typeof TaskResponseSchema>;
export type TaskList = z.infer<typeof TaskListResponseSchema>;
export type DailyProgress = z.infer<typeof DailyProgressResponseSchema>;
export type InAppNotification = z.infer<typeof InAppNotificationSchema>;
export type InAppNotificationList = z.infer<typeof InAppNotificationListSchema>;
export type UnreadCount = z.infer<typeof UnreadCountSchema>;
