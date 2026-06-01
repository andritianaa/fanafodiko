import { AppError } from "@/core/errors/AppError";
import { IUserRepository } from "@/modules/identity/domain/repositories/IUserRepository";
import { PharmacyRole } from "../../domain/value-objects/PharmacyRole";
import { PharmacyMembership } from "../../domain/entities/PharmacyMembership";
import { IPharmacyMembershipRepository } from "../../domain/repositories/IPharmacyMembershipRepository";

/** Empêche de retirer/rétrograder le dernier superadmin d'une pharmacie. */
async function assertNotLastSuperadmin(
  repo: IPharmacyMembershipRepository,
  pharmacyId: string,
  targetUserId: string
): Promise<void> {
  const members = await repo.findByPharmacy(pharmacyId);
  const superadmins = members.filter((m) => m.role === "superadmin");
  if (
    superadmins.length <= 1 &&
    superadmins.some((m) => m.userId === targetUserId)
  ) {
    throw new AppError(
      "Impossible : c'est le dernier superadmin de la pharmacie",
      400,
      "LAST_SUPERADMIN"
    );
  }
}

export class ListMembers {
  constructor(
    private readonly membershipRepo: IPharmacyMembershipRepository,
    private readonly userRepo: IUserRepository
  ) {}

  async execute(pharmacyId: string) {
    const members = await this.membershipRepo.findByPharmacy(pharmacyId);
    const enriched = await Promise.all(
      members.map(async (m) => {
        const user = await this.userRepo.findById(m.userId);
        return {
          userId: m.userId,
          email: user?.email.getValue() ?? "(compte supprimé)",
          role: m.role,
          createdAt:
            m.props.createdAt?.toISOString() ?? new Date().toISOString(),
        };
      })
    );
    return enriched;
  }
}

export class UpdateMemberRole {
  constructor(private readonly membershipRepo: IPharmacyMembershipRepository) {}

  /** Réservé au superadmin (vérifié par le middleware). */
  async execute(
    pharmacyId: string,
    targetUserId: string,
    newRole: PharmacyRole
  ): Promise<void> {
    const target = await this.membershipRepo.findByPharmacyAndUser(
      pharmacyId,
      targetUserId
    );
    if (!target) throw new AppError("Membre introuvable", 404, "NOT_FOUND");

    // Si on rétrograde un superadmin, vérifier qu'il en reste un autre
    if (target.role === "superadmin" && newRole !== "superadmin") {
      await assertNotLastSuperadmin(this.membershipRepo, pharmacyId, targetUserId);
    }

    await this.membershipRepo.save(target.withRole(newRole));
  }
}

export class RemoveMember {
  constructor(private readonly membershipRepo: IPharmacyMembershipRepository) {}

  async execute(
    pharmacyId: string,
    actorRole: PharmacyRole,
    targetUserId: string
  ): Promise<void> {
    const target = await this.membershipRepo.findByPharmacyAndUser(
      pharmacyId,
      targetUserId
    );
    if (!target) throw new AppError("Membre introuvable", 404, "NOT_FOUND");

    // Un admin ne peut retirer que des staff ; retirer un admin/superadmin = superadmin requis
    if (target.role !== "staff" && actorRole !== "superadmin") {
      throw new AppError(
        "Seul un superadmin peut retirer un administrateur",
        403,
        "FORBIDDEN"
      );
    }

    if (target.role === "superadmin") {
      await assertNotLastSuperadmin(this.membershipRepo, pharmacyId, targetUserId);
    }

    await this.membershipRepo.delete(pharmacyId, targetUserId);
  }
}

export class AssignPharmacyOwner {
  constructor(
    private readonly membershipRepo: IPharmacyMembershipRepository,
    private readonly userRepo: IUserRepository
  ) {}

  /** Utilisé par l'admin plateforme pour désigner un superadmin (propriétaire). */
  async execute(pharmacyId: string, email: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email.toLowerCase().trim());
    if (!user?.id) {
      throw new AppError(
        "Aucun compte avec cet email. L'utilisateur doit d'abord créer un compte.",
        404,
        "USER_NOT_FOUND"
      );
    }

    const membership = PharmacyMembership.create({
      pharmacyId,
      userId: user.id,
      role: "superadmin",
    });
    await this.membershipRepo.save(membership);
  }
}
