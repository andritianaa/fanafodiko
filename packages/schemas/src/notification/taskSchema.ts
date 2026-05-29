import { z } from "@hono/zod-openapi";

export const TaskResponseSchema = z.object({
  id: z.string(),
  medicationId: z.string(),
  profileId: z.string(),
  scheduledAt: z.string(),
  status: z.enum(["PENDING", "TAKEN", "MISSED", "SKIPPED"]),
  takenAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const TaskListResponseSchema = z.array(TaskResponseSchema);
