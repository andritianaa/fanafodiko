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
} from '@ext/schemas';

export type LoginInput = z.infer<typeof LoginSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type RequestPasswordResetInput = z.infer<typeof RequestPasswordResetSchema>;
export type RequestPasswordResetResponse = z.infer<typeof RequestPasswordResetResponseSchema>;
export type ConfirmPasswordResetInput = z.infer<typeof ConfirmPasswordResetSchema>;
export type ConfirmPasswordResetResponse = z.infer<typeof ConfirmPasswordResetResponseSchema>;
