import { z } from "@hono/zod-openapi";

export const HouseholdMemberSchema = z.object({
  id: z.string().openapi({ example: "profile-123" }),
  accountId: z.string().openapi({ example: "account-123" }),
  firstName: z.string().openapi({ example: "John" }),
  lastName: z.string().openapi({ example: "Doe" }),
  dateOfBirth: z.string().openapi({ example: "1990-01-01T00:00:00.000Z" }),
  relationship: z.string().openapi({ example: "child" }),
  avatarUrl: z.string().optional().openapi({ example: "https://example.com/avatar.jpg" }),
});

export const CreateHouseholdMemberSchema = z.object({
  firstName: z.string().min(1).openapi({ example: "Alice" }),
  lastName: z.string().min(1).openapi({ example: "Doe" }),
  dateOfBirth: z.string().openapi({ example: "2015-05-15" }), // YYYY-MM-DD or ISO string
  relationship: z.string().min(1).openapi({ example: "child" }),
  avatarUrl: z.string().optional().openapi({ example: "https://example.com/alice.jpg" }),
});

export const UpdateHouseholdMemberSchema = z.object({
  firstName: z.string().optional().openapi({ example: "Alice" }),
  lastName: z.string().optional().openapi({ example: "Doe" }),
  dateOfBirth: z.string().optional().openapi({ example: "2015-05-15" }),
  avatarUrl: z.string().optional().openapi({ example: "https://example.com/alice-new.jpg" }),
});

export const HouseholdMemberListSchema = z.array(HouseholdMemberSchema);
