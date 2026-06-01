export const USER_ROLES = ["user", "admin", "support"] as const;
export type UserRole = (typeof USER_ROLES)[number];
