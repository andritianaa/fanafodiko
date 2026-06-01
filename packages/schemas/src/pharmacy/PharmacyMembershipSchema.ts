import { z } from "@hono/zod-openapi";

export const PHARMACY_ROLES = ["superadmin", "admin", "staff"] as const;
export type PharmacyRole = (typeof PHARMACY_ROLES)[number];

// Rôles assignables via invitation (on ne peut pas inviter directement un superadmin)
export const INVITABLE_ROLES = ["admin", "staff"] as const;

export const PharmacyMemberSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  role: z.enum(PHARMACY_ROLES),
  createdAt: z.string(),
});

export const PharmacyMembersResponseSchema = z.object({
  members: z.array(PharmacyMemberSchema),
});

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(INVITABLE_ROLES),
});

export const UpdateMemberRoleSchema = z.object({
  role: z.enum(PHARMACY_ROLES),
});

export const AssignOwnerSchema = z.object({
  email: z.string().email(),
});

export const PharmacyInvitationSchema = z.object({
  token: z.string(),
  pharmacyId: z.string(),
  pharmacyName: z.string(),
  email: z.string().email(),
  role: z.enum(INVITABLE_ROLES),
  status: z.enum(["pending", "accepted", "expired"]),
  expiresAt: z.string(),
});

// Pharmacie telle que vue par un membre dans "Ma pharmacie" (inclut son rôle)
export const MyPharmacySchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  role: z.enum(PHARMACY_ROLES),
});

export const MyPharmaciesResponseSchema = z.object({
  pharmacies: z.array(MyPharmacySchema),
});

export type PharmacyMember = z.infer<typeof PharmacyMemberSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;
export type AssignOwnerInput = z.infer<typeof AssignOwnerSchema>;
export type PharmacyInvitation = z.infer<typeof PharmacyInvitationSchema>;
export type MyPharmacy = z.infer<typeof MyPharmacySchema>;
