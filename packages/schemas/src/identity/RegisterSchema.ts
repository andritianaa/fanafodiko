import { emailSchema, passwordSchema } from "@ext/utils";
import { z } from "@hono/zod-openapi";

export const RegisterSchema = z.object({
  email: emailSchema.openapi({ example: "user@example.com" }),
  password: passwordSchema.openapi({ example: "Password123!" }),
  fullName: z.string().min(1, "Le nom complet est requis").openapi({ example: "John Doe" }),
});



export const RegisterResponseSchema = z.object({
  id: z.string().openapi({ example: "65f1a..." }),
  email: z.string().email().openapi({ example: "user@example.com" }),
  role: z.enum(["user", "admin", "support"]).optional().openapi({ example: "user" }),
  message: z.string().openapi({ example: "User created successfully" }),
});
