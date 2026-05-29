import { z } from "@hono/zod-openapi";

export const DailyProgressResponseSchema = z.object({
  date: z.string(),
  totalTasks: z.number(),
  takenCount: z.number(),
  missedCount: z.number(),
  skippedCount: z.number(),
  pendingCount: z.number(),
  adherenceRate: z.number(),
});
