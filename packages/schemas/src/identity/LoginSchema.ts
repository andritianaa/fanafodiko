import { emailSchema, passwordSchema } from "@ext/utils";
import { z } from "@hono/zod-openapi";

export const LoginSchema = z.object({
  email: emailSchema.openapi({ example: "user@example.com" }),
  password: passwordSchema.openapi({ example: "Password123!" }),
});

export const LoginResponseSchema = z.object({
  token: z.string().openapi({ example: "eyJhbGciOiJIUzI1NiIsInR..." }),
});

export const LogoutSchema = z.object({});
