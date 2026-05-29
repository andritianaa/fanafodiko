import { z } from 'zod';

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must not exceed 255 characters')
  .toLowerCase();

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must not exceed 30 characters')
  .regex(/^\w+$/, 'Username can only contain letters, numbers, and underscores')
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number');

export const messageContentSchema = z
  .string()
  .min(1, 'Message cannot be empty')
  .max(5000, 'Message must not exceed 5000 characters');

export type Email = z.infer<typeof emailSchema>;
export type Username = z.infer<typeof usernameSchema>;
export type Password = z.infer<typeof passwordSchema>;
export type MessageContent = z.infer<typeof messageContentSchema>;
