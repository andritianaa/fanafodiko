import { z } from "@hono/zod-openapi";

export const InAppNotificationSchema = z.object({
  id: z.string(), 
  profileId: z.string(),
  taskId: z.string().optional(),
  medicationName: z.string(),
  dosage: z.string(),
  scheduledAt: z.string(),
  message: z.string(),
  read: z.boolean(),
  createdAt: z.string(),
});

export const InAppNotificationListSchema = z.array(InAppNotificationSchema);

export const UnreadCountSchema = z.object({
  unreadCount: z.number(),
});
