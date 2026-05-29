import { z } from 'zod';
import {
  CreateMedicationSchema,
  UpdateMedicationSchema,
  MedicationResponseSchema,
  MedicationListSchema,
  FrequencySchema,
} from '@ext/schemas';

export type Frequency = z.infer<typeof FrequencySchema>;
export type CreateMedicationInput = z.infer<typeof CreateMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof UpdateMedicationSchema>;
export type Medication = z.infer<typeof MedicationResponseSchema>;
export type MedicationList = z.infer<typeof MedicationListSchema>;

export type FrequencyType = 'DAILY' | 'WEEKLY' | 'INTERVAL';
