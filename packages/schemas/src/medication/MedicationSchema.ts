import { z } from "@hono/zod-openapi";


export const FrequencySchema = z.object({
  type: z.enum(['DAILY', 'WEEKLY', 'INTERVAL']).openapi({
    example: 'DAILY',
    description: 'Frequency type'
  }),
  times: z.array(z.string()).openapi({
    example: ['08:00', '20:00'],
    description: 'List of times in HH:mm format'
  }),
  days: z.array(z.string()).optional().openapi({
    example: ['MONDAY', 'THURSDAY'],
    description: 'List of days (required for WEEKLY)'
  }),
}).openapi('Frequency');

export const CreateMedicationSchema = z.object({
  profileId: z.string().openapi({ example: 'profile-uuid', description: 'ID associated profile' }),
  name: z.string().openapi({ example: 'Doliprane', description: 'Medication name' }),
  dosage: z.string().openapi({ example: '500mg', description: 'Dosage instructions' }),
  frequency: FrequencySchema,
  startDate: z.string().datetime().openapi({ example: '2023-01-01T00:00:00Z', description: 'Start date' }),
  endDate: z.string().datetime().nullable().optional().openapi({ example: '2023-01-10T00:00:00Z', description: 'End date (optional)' }),
  utcOffsetMinutes: z.number().default(0).openapi({ example: -180, description: 'Browser timezone offset from getTimezoneOffset() — negative for UTC+ zones (e.g., -180 for UTC+3/Madagascar)' }),
}).openapi('CreateMedication');

export const UpdateMedicationSchema = z.object({
  name: z.string().optional().openapi({ example: 'Doliprane', description: 'Medication name' }),
  dosage: z.string().optional().openapi({ example: '1000mg', description: 'Dosage instructions' }),
  frequency: FrequencySchema.optional(),
  startDate: z.string().datetime().optional().openapi({ example: '2023-01-01T00:00:00Z', description: 'Start date' }),
  endDate: z.string().datetime().nullable().optional().openapi({ example: '2023-01-10T00:00:00Z', description: 'End date (optional)' }),
  utcOffsetMinutes: z.number().optional().openapi({ example: -180, description: 'Browser timezone offset' }),
}).openapi('UpdateMedication');

export const ToggleMedicationStatusSchema = z.object({
  isActive: z.boolean().openapi({ example: false, description: 'True to activate, False to pause' }),
}).openapi('ToggleMedicationStatus');

export const MedicationResponseSchema = z.object({
  id: z.string().openapi({ example: 'medication-uuid' }),
  profileId: z.string().openapi({ example: 'profile-uuid' }),
  name: z.string().openapi({ example: 'Doliprane' }),
  dosage: z.string().openapi({ example: '500mg' }),
  frequency: FrequencySchema,
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  isActive: z.boolean(),
  utcOffsetMinutes: z.number().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('MedicationResponse');

export const MedicationListSchema = z.array(MedicationResponseSchema).openapi('MedicationList');
