import { createMiddleware } from "hono/factory";
import { AppError } from "@/core/errors/AppError";
import { HonoEnv } from "@/core/types/hono-env";
import { PharmacyRole, hasPharmacyRank } from "../../domain/value-objects/PharmacyRole";
import { IPharmacyMembershipRepository } from "../../domain/repositories/IPharmacyMembershipRepository";

/**
 * Vérifie que l'utilisateur courant est membre de la pharmacie `:id`
 * avec un rôle >= `min`. Pose la membership dans le contexte.
 * Doit être monté APRÈS authMiddleware.
 */
export function requirePharmacyRole(
  membershipRepo: IPharmacyMembershipRepository,
  min: PharmacyRole
) {
  return createMiddleware<HonoEnv>(async (c, next) => {
    const user = c.get("user");
    const pharmacyId = c.req.param("id");

    if (!pharmacyId) {
      throw new AppError("Pharmacie non spécifiée", 400, "MISSING_PHARMACY_ID");
    }

    const membership = await membershipRepo.findByPharmacyAndUser(
      pharmacyId,
      user.id!
    );

    if (!membership) {
      throw new AppError("Vous n'êtes pas membre de cette pharmacie", 403, "FORBIDDEN");
    }

    if (!hasPharmacyRank(membership.role, min)) {
      throw new AppError("Droits insuffisants sur cette pharmacie", 403, "FORBIDDEN");
    }

    c.set("pharmacyMembership", {
      pharmacyId: membership.pharmacyId,
      userId: membership.userId,
      role: membership.role,
    });

    await next();
  });
}
