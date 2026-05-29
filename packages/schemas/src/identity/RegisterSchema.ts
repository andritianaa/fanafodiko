import { emailSchema, passwordSchema } from "@ext/utils";
import { z } from "@hono/zod-openapi";

export const RegisterSchema = z.object({
  email: emailSchema.openapi({ example: "user@example.com" }),
  password: passwordSchema.openapi({ example: "Password123!" }),
  firstName: z.string().min(1, "Le prénom est requis").openapi({ example: "John" }),
  lastName: z.string().min(1, "Le nom est requis").openapi({ example: "Doe" }),
  dateOfBirth: z.coerce.date().openapi({ example: "1990-01-01" }),
});



export const RegisterResponseSchema = z.object({
  id: z.string().openapi({ example: "65f1a..." }),
  email: z.string().email().openapi({ example: "user@example.com" }),
  message: z.string().openapi({ example: "User created successfully" }),
});
