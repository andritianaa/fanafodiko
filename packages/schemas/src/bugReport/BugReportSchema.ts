import { z } from 'zod';

// ── Device info ──────────────────────────────────────────────────────────────

export const DeviceInfoSchema = z.object({
  platform: z.enum(['web', 'android', 'ios']),
  // Web
  browser: z.string().optional(),
  browserVersion: z.string().optional(),
  os: z.string().optional(),
  userAgent: z.string().optional(),
  // Mobile & Web
  screenSize: z.string().optional(),
  language: z.string().optional(),
  // Mobile
  osVersion: z.string().optional(),
  appVersion: z.string().optional(),
});

export type DeviceInfo = z.infer<typeof DeviceInfoSchema>;

// ── Create input ─────────────────────────────────────────────────────────────

export const CreateBugReportSchema = z.object({
  description: z.string().min(10, 'Description trop courte (min 10 caractères)'),
  screenshots: z.array(z.string()).default([]),
  deviceInfo: DeviceInfoSchema,
});

export type CreateBugReportInput = z.infer<typeof CreateBugReportSchema>;

// ── Bug report entity ─────────────────────────────────────────────────────────

export const BugReportSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userEmail: z.string(),
  description: z.string(),
  screenshots: z.array(z.string()),
  deviceInfo: DeviceInfoSchema,
  status: z.enum(['open', 'resolved', 'cancelled']),
  adminMessage: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type BugReport = z.infer<typeof BugReportSchema>;

// ── Admin update ──────────────────────────────────────────────────────────────

export const UpdateBugReportSchema = z.object({
  status: z.enum(['resolved', 'cancelled']),
  adminMessage: z.string().min(1, 'Un message est requis').max(1000),
});

export type UpdateBugReportInput = z.infer<typeof UpdateBugReportSchema>;

// ── List response ─────────────────────────────────────────────────────────────

export const BugReportListResponseSchema = z.object({
  reports: z.array(BugReportSchema),
  total: z.number(),
});
