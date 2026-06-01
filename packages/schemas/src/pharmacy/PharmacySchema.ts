import { z } from "@hono/zod-openapi";

export const OpeningHourSchema = z.object({
  day: z.number().min(0).max(6), // 0=Sunday … 6=Saturday
  open: z.string().regex(/^\d{2}:\d{2}$/).optional(), // "08:00"
  close: z.string().regex(/^\d{2}:\d{2}$/).optional(), // "17:00"
  isClosed: z.boolean(),
});

export const GuardScheduleSchema = z.object({
  weekIdentifier: z.string().regex(/^\d{4}-W\d{2}$/), // "2026-W22"
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean(),
});

export const PHARMACY_CONTACT_TYPES = [
  "phone",
  "email",
  "whatsapp",
  "facebook",
  "other",
] as const;

export const PharmacyContactSchema = z.object({
  type: z.enum(PHARMACY_CONTACT_TYPES),
  label: z.string().optional(),
  value: z.string().min(1),
});

export const PharmacySchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  landmark: z.string().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }),
  phone: z.string().optional(), // legacy / fallback
  contacts: z.array(PharmacyContactSchema).default([]),
  images: z.array(z.string()).default([]),
  city: z.string(),
  region: z.string().optional(),
  isOpen24h: z.boolean(),
  openingHours: z.array(OpeningHourSchema),
  guardSchedules: z.array(GuardScheduleSchema),
  // Computed fields returned by the API
  isOpenNow: z.boolean().optional(),
  isOnGuard: z.boolean().optional(),
});

export const PharmacyListResponseSchema = z.object({
  pharmacies: z.array(PharmacySchema),
  total: z.number(),
});

export const PharmacySearchResponseSchema = z.object({
  results: z.array(
    z.object({ id: z.string(), name: z.string(), city: z.string() })
  ),
});

export const CreatePharmacySchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  landmark: z.string().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }),
  phone: z.string().optional(),
  contacts: z.array(PharmacyContactSchema).default([]),
  images: z.array(z.string()).default([]),
  city: z.string().min(1),
  region: z.string().optional(),
  isOpen24h: z.boolean().default(false),
  openingHours: z.array(OpeningHourSchema).default([]),
});

export const UpdatePharmacySchema = CreatePharmacySchema.partial();

// Sous-ensemble modifiable par un membre staff+ (horaires + images uniquement)
export const UpdatePharmacyHoursSchema = z.object({
  openingHours: z.array(OpeningHourSchema),
  isOpen24h: z.boolean().optional(),
});

// Sous-ensemble modifiable par un membre admin+ (infos globales)
export const UpdatePharmacyInfoSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  landmark: z.string().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  contacts: z.array(PharmacyContactSchema).optional(),
  city: z.string().min(1).optional(),
  region: z.string().optional(),
});

export const BatchGuardSchema = z.object({
  pharmacyIds: z.array(z.string()).min(1),
  weekIdentifier: z.string().regex(/^\d{4}-W\d{2}$/),
  isActive: z.boolean(),
});

export const ToggleGuardSchema = z.object({
  weekIdentifier: z.string().regex(/^\d{4}-W\d{2}$/),
  isActive: z.boolean(),
});

export type Pharmacy = z.infer<typeof PharmacySchema>;
export type OpeningHour = z.infer<typeof OpeningHourSchema>;
export type GuardSchedule = z.infer<typeof GuardScheduleSchema>;
export type PharmacyContact = z.infer<typeof PharmacyContactSchema>;
export type PharmacyContactType = (typeof PHARMACY_CONTACT_TYPES)[number];
export type CreatePharmacyInput = z.infer<typeof CreatePharmacySchema>;
export type UpdatePharmacyInput = z.infer<typeof UpdatePharmacySchema>;
export type UpdatePharmacyHoursInput = z.infer<typeof UpdatePharmacyHoursSchema>;
export type UpdatePharmacyInfoInput = z.infer<typeof UpdatePharmacyInfoSchema>;
export type BatchGuardInput = z.infer<typeof BatchGuardSchema>;
