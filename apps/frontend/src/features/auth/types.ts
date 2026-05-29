import { z } from 'zod';
import {
  LoginSchema,
  LoginResponseSchema,
  RegisterSchema,
  RegisterResponseSchema,
  RequestPasswordResetSchema,
  RequestPasswordResetResponseSchema,
  ConfirmPasswordResetSchema,
  ConfirmPasswordResetResponseSchema,
  ChangePasswordSchema,
  ChangePasswordResponseSchema,
  ChangeEmailSchema,
  ChangeEmailResponseSchema,
} from '@ext/schemas';

export type LoginInput = z.infer<typeof LoginSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type RequestPasswordResetInput = z.infer<typeof RequestPasswordResetSchema>;
export type RequestPasswordResetResponse = z.infer<typeof RequestPasswordResetResponseSchema>;
export type ConfirmPasswordResetInput = z.infer<typeof ConfirmPasswordResetSchema>;
export type ConfirmPasswordResetResponse = z.infer<typeof ConfirmPasswordResetResponseSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type ChangePasswordResponse = z.infer<typeof ChangePasswordResponseSchema>;
export type ChangeEmailInput = z.infer<typeof ChangeEmailSchema>;
export type ChangeEmailResponse = z.infer<typeof ChangeEmailResponseSchema>;
