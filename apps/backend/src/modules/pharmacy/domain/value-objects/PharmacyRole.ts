export const PHARMACY_ROLES = ["superadmin", "admin", "staff"] as const;
export type PharmacyRole = (typeof PHARMACY_ROLES)[number];

// Hiérarchie : staff(1) < admin(2) < superadmin(3)
const RANK: Record<PharmacyRole, number> = {
  staff: 1,
  admin: 2,
  superadmin: 3,
};

/** Vrai si `role` est au moins de niveau `min`. */
export function hasPharmacyRank(role: PharmacyRole, min: PharmacyRole): boolean {
  return RANK[role] >= RANK[min];
}

export function rankOf(role: PharmacyRole): number {
  return RANK[role];
}
