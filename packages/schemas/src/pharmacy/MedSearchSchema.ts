import { z } from "@hono/zod-openapi";

export const CreateMedSearchSchema = z.object({
  medicationName: z.string().min(1).max(200),
  coordinates: z.object({ lat: z.number(), lng: z.number() }),
  radiusKm: z.number().min(0.5).max(50).default(5),
  note: z.string().max(500).optional(),
});

export const MedSearchResponseSchema = z.object({
  searchId: z.string(),
  pharmacyId: z.string(),
  pharmacyName: z.string(),
  hasStock: z.boolean(),
  note: z.string().optional(),
  distance: z.number().optional(),
  respondedAt: z.string(),
});

export const MedSearchSchema = z.object({
  id: z.string(),
  userId: z.string(),
  medicationName: z.string(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }),
  radiusKm: z.number(),
  note: z.string().optional(),
  status: z.enum(["active", "closed"]),
  nearbyPharmacies: z.array(
    z.object({ id: z.string(), name: z.string(), distance: z.number(), coordinates: z.object({ lat: z.number(), lng: z.number() }) })
  ),
  responses: z.array(MedSearchResponseSchema),
  createdAt: z.string(),
  expiresAt: z.string(),
});

export const RespondToSearchSchema = z.object({
  hasStock: z.boolean(),
  note: z.string().max(500).optional(),
});

export type CreateMedSearchInput = z.infer<typeof CreateMedSearchSchema>;
export type MedSearch = z.infer<typeof MedSearchSchema>;
export type MedSearchResponse = z.infer<typeof MedSearchResponseSchema>;
export type RespondToSearchInput = z.infer<typeof RespondToSearchSchema>;
