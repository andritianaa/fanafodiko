import { z } from "@hono/zod-openapi";

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).openapi({ example: "OldPassword123!" }),
  newPassword: z.string().min(8).openapi({ example: "NewPassword456!" }),
});

export const ChangePasswordResponseSchema = z.object({
  message: z.string().openapi({ example: "Mot de passe modifié avec succès." }),
});

export const ChangeEmailSchema = z.object({
  newEmail: z.string().email().openapi({ example: "newemail@example.com" }),
  currentPassword: z.string().min(1).openapi({ example: "Password123!" }),
});

export const ChangeEmailResponseSchema = z.object({
  email: z.string().email().openapi({ example: "newemail@example.com" }),
  message: z.string().openapi({ example: "Email modifié avec succès." }),
});
