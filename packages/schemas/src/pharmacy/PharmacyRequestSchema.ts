import { z } from "@hono/zod-openapi";
import { OpeningHourSchema, PharmacyContactSchema } from "./PharmacySchema";

// Payload pharmacie soumis par l'utilisateur
export const PharmacyRequestPayloadSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  landmark: z.string().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }),
  contacts: z.array(PharmacyContactSchema).default([]),
  city: z.string().min(1),
  region: z.string().optional(),
  isOpen24h: z.boolean().default(false),
  openingHours: z.array(OpeningHourSchema).default([]),
});

export const CreatePharmacyRequestSchema = PharmacyRequestPayloadSchema.extend({
  wantsToManage: z.boolean().default(false),
  proofImages: z.array(z.string()).default([]), // URLs d'images justificatives
});

export const PharmacyRequestSchema = z.object({
  id: z.string(),
  payload: PharmacyRequestPayloadSchema,
  submittedByEmail: z.string(),
  wantsToManage: z.boolean(),
  proofImages: z.array(z.string()),
  status: z.enum(["pending", "approved", "rejected"]),
  managementStatus: z.enum(["none", "pending", "approved", "rejected"]),
  rejectionReason: z.string().optional(),
  createdPharmacyId: z.string().optional(),
  createdAt: z.string(),
});

export const PharmacyRequestsResponseSchema = z.object({
  requests: z.array(PharmacyRequestSchema),
  total: z.number(),
});

export const RejectRequestSchema = z.object({
  reason: z.string().optional(),
});

export type PharmacyRequestPayload = z.infer<typeof PharmacyRequestPayloadSchema>;
export type CreatePharmacyRequestInput = z.infer<typeof CreatePharmacyRequestSchema>;
export type PharmacyRequest = z.infer<typeof PharmacyRequestSchema>;
