import { AppError } from "@/core/errors/AppError";
import { IMailer } from "@/core/services/mailing/IMailer";
import { pharmacyClaimDecisionEmailTemplate } from "@/core/services/mailing/emailTemplates";
import { IUserRepository } from "@/modules/identity/domain/repositories/IUserRepository";
import { PharmacyMembership } from "../../domain/entities/PharmacyMembership";
import { IPharmacyClaimRepository } from "../../domain/repositories/IPharmacyClaimRepository";
import { IPharmacyMembershipRepository } from "../../domain/repositories/IPharmacyMembershipRepository";

async function notifyClaimant(
  mailer: IMailer,
  email: string,
  opts: { pharmacyName: string; approved: boolean; reason?: string },
) {
  try {
    const { subject, html } = pharmacyClaimDecisionEmailTemplate(opts);
    await mailer.sendEmail(email, subject, html);
  } catch (e) {
    console.error("Failed to notify claimant:", e);
  }
}

export class ListPharmacyClaims {
  constructor(private readonly claimRepo: IPharmacyClaimRepository) {}

  async execute() {
    return this.claimRepo.findAll();
  }
}

export class ApprovePharmacyClaim {
  constructor(
    private readonly claimRepo: IPharmacyClaimRepository,
    private readonly membershipRepo: IPharmacyMembershipRepository,
    private readonly mailer: IMailer,
  ) {}

  async execute(claimId: string): Promise<void> {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim) throw new AppError("Réclamation introuvable", 404, "CLAIM_NOT_FOUND");
    if (claim.status !== "pending") throw new AppError("Réclamation déjà traitée", 400, "ALREADY_REVIEWED");

    const membership = PharmacyMembership.create({
      pharmacyId: claim.pharmacyId,
      userId: claim.submittedBy,
      role: "superadmin",
    });
    await this.membershipRepo.save(membership);
    await this.claimRepo.update(claim.approve());

    await notifyClaimant(this.mailer, claim.submittedByEmail, {
      pharmacyName: claim.pharmacyName,
      approved: true,
    });
  }
}

export class RejectPharmacyClaim {
  constructor(
    private readonly claimRepo: IPharmacyClaimRepository,
    private readonly mailer: IMailer,
  ) {}

  async execute(claimId: string, reason?: string): Promise<void> {
    const claim = await this.claimRepo.findById(claimId);
    if (!claim) throw new AppError("Réclamation introuvable", 404, "CLAIM_NOT_FOUND");
    if (claim.status !== "pending") throw new AppError("Réclamation déjà traitée", 400, "ALREADY_REVIEWED");

    await this.claimRepo.update(claim.reject(reason));

    await notifyClaimant(this.mailer, claim.submittedByEmail, {
      pharmacyName: claim.pharmacyName,
      approved: false,
      reason,
    });
  }
}
