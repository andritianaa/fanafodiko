import { z } from "@hono/zod-openapi";

export const PushTokenSchema = z.object({
  token: z.string().min(1).openapi({ example: "ExponentPushToken[xxxx]" }),
});

export const PushTokenResponseSchema = z.object({
  message: z.string().openapi({ example: "Token enregistré" }),
});

export const NotificationPreferencesUpdateSchema = z.object({
  emailMedicationReminders: z.boolean().optional().openapi({ example: true }),
  emailMedSearchResponse: z.boolean().optional().openapi({ example: true }),
  emailPharmacyInvitation: z.boolean().optional().openapi({ example: true }),
});

export const NotificationPreferencesResponseSchema = z.object({
  emailMedicationReminders: z.boolean(),
  emailMedSearchResponse: z.boolean(),
  emailPharmacyInvitation: z.boolean(),
});

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
