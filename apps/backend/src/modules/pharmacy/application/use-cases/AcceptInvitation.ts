import { AppError } from "@/core/errors/AppError";
import { IUserRepository } from "@/modules/identity/domain/repositories/IUserRepository";
import { PharmacyMembership } from "../../domain/entities/PharmacyMembership";
import { IPharmacyInvitationRepository } from "../../domain/repositories/IPharmacyInvitationRepository";
import { IPharmacyMembershipRepository } from "../../domain/repositories/IPharmacyMembershipRepository";

export class AcceptInvitation {
  constructor(
    private readonly invitationRepo: IPharmacyInvitationRepository,
    private readonly membershipRepo: IPharmacyMembershipRepository,
    private readonly userRepo: IUserRepository
  ) {}

  async execute(token: string, userId: string): Promise<{ pharmacyId: string }> {
    const invitation = await this.invitationRepo.findByToken(token);
    if (!invitation) throw new AppError("Invitation introuvable", 404, "NOT_FOUND");

    if (!invitation.isValid()) {
      throw new AppError("Invitation expirée ou déjà utilisée", 410, "INVITATION_INVALID");
    }

    const user = await this.userRepo.findById(userId);
    if (!user) throw new AppError("Utilisateur introuvable", 404, "USER_NOT_FOUND");

    // L'email du compte doit correspondre à l'email invité
    if (user.email.getValue().toLowerCase() !== invitation.email.toLowerCase()) {
      throw new AppError(
        "Cette invitation est destinée à une autre adresse email",
        403,
        "EMAIL_MISMATCH"
      );
    }

    const membership = PharmacyMembership.create({
      pharmacyId: invitation.pharmacyId,
      userId,
      role: invitation.role,
    });
    await this.membershipRepo.save(membership);
    await this.invitationRepo.update(invitation.accept());

    return { pharmacyId: invitation.pharmacyId };
  }
}
