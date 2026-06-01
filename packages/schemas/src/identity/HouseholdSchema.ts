import { z } from "@hono/zod-openapi";

export const HouseholdMemberSchema = z.object({
  id: z.string().openapi({ example: "profile-123" }),
  accountId: z.string().openapi({ example: "account-123" }),
  fullName: z.string().openapi({ example: "John Doe" }),
  relationship: z.string().openapi({ example: "child" }),
  avatarUrl: z.string().optional().openapi({ example: "https://example.com/avatar.jpg" }),
});

export const CreateHouseholdMemberSchema = z.object({
  fullName: z.string().min(1).openapi({ example: "Alice Doe" }),
  relationship: z.string().min(1).openapi({ example: "child" }),
  avatarUrl: z.string().optional().openapi({ example: "https://example.com/alice.jpg" }),
});

export const UpdateHouseholdMemberSchema = z.object({
  fullName: z.string().optional().openapi({ example: "Alice Doe" }),
  avatarUrl: z.string().optional().openapi({ example: "https://example.com/alice-new.jpg" }),
});

export const HouseholdMemberListSchema = z.array(HouseholdMemberSchema);
