import { z } from 'zod';
import {
  HouseholdMemberSchema,
  CreateHouseholdMemberSchema,
  UpdateHouseholdMemberSchema,
  HouseholdMemberListSchema,
} from '@ext/schemas';

export type HouseholdMember = z.infer<typeof HouseholdMemberSchema>;
export type CreateHouseholdMemberInput = z.infer<typeof CreateHouseholdMemberSchema>;
export type UpdateHouseholdMemberInput = z.infer<typeof UpdateHouseholdMemberSchema>;
export type HouseholdMemberList = z.infer<typeof HouseholdMemberListSchema>;
