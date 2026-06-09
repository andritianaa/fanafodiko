import { z } from "@hono/zod-openapi";

export const CreatePharmacyClaimSchema = z.object({
  pharmacyId: z.string().min(1),
  contactInfo: z.string().min(1), // téléphone ou email du réclamant
  proofImages: z.array(z.string()).default([]),
});

export const PharmacyClaimSchema = z.object({
  id: z.string(),
  pharmacyId: z.string(),
  pharmacyName: z.string(),
  submittedByEmail: z.string(),
  contactInfo: z.string(),
  proofImages: z.array(z.string()),
  status: z.enum(["pending", "approved", "rejected"]),
  rejectionReason: z.string().optional(),
  createdAt: z.string(),
});

export const PharmacyClaimsResponseSchema = z.object({
  claims: z.array(PharmacyClaimSchema),
  total: z.number(),
});

export const ReviewPharmacyClaimSchema = z.object({
  reason: z.string().optional(),
});

export type CreatePharmacyClaimInput = z.infer<typeof CreatePharmacyClaimSchema>;
export type PharmacyClaim = z.infer<typeof PharmacyClaimSchema>;
