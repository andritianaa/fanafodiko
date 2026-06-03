import { z } from "@hono/zod-openapi";

export const InAppNotificationSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  type: z.enum(['medication_reminder', 'search_response', 'bug_report_update']).optional(),
  taskId: z.string().optional(),
  medicationName: z.string(),
  dosage: z.string().optional(),
  scheduledAt: z.string().optional(),
  pharmacyName: z.string().optional(),
  hasStock: z.boolean().optional(),
  searchId: z.string().optional(),
  message: z.string(),
  read: z.boolean(),
  createdAt: z.string(),
});

export const InAppNotificationListSchema = z.array(InAppNotificationSchema);

export const UnreadCountSchema = z.object({
  unreadCount: z.number(),
});
