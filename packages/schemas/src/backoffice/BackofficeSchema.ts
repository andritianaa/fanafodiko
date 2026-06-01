import { z } from "@hono/zod-openapi";

export const BackofficeUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(["user", "admin", "support"]),
  createdAt: z.string(),
});

export const BackofficeUsersResponseSchema = z.object({
  users: z.array(BackofficeUserSchema),
  total: z.number(),
});

export type BackofficeUser = z.infer<typeof BackofficeUserSchema>;
export type BackofficeUsersResponse = z.infer<typeof BackofficeUsersResponseSchema>;
