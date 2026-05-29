import { z } from "@hono/zod-openapi";

export const RequestPasswordResetSchema = z.object({
  email: z.string().email().openapi({
    example: "john.doe@example.com",
    description: "The email address to send the reset link to",
  }),
});

export const RequestPasswordResetResponseSchema = z.object({
  message: z.string().openapi({
    example: "If an account with that email exists, a reset link has been sent.",
  }),
});

export const ConfirmPasswordResetSchema = z.object({
  code: z.string().min(1).openapi({
    example: "123456",
    description: "The reset code received via email",
  }),
  newPassword: z.string().min(8).openapi({
    example: "NewPassword123!",
    description: "The new password",
  }),
});

export const ConfirmPasswordResetResponseSchema = z.object({
  message: z.string().openapi({
    example: "Password has been successfully reset.",
  }),
});
