import { AppError } from "@/core/errors/AppError";
import { IMailer } from "@/core/services/mailing/IMailer";
import { newPharmacyClaimEmailTemplate } from "@/core/services/mailing/emailTemplates";
import { IUserRepository } from "@/modules/identity/domain/repositories/IUserRepository";
import { PharmacyClaim } from "../../domain/entities/PharmacyClaim";
import { IPharmacyClaimRepository } from "../../domain/repositories/IPharmacyClaimRepository";
import { IPharmacyRepository } from "../../domain/repositories/IPharmacyRepository";
import type { CreatePharmacyClaimInput } from "@ext/schemas";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

async function resolveAdminEmails(userRepo: IUserRepository): Promise<string[]> {
  const envEmail = process.env.PLATFORM_ADMIN_EMAIL;
  if (envEmail) return [envEmail];
  const users = await userRepo.findAll();
  return users
    .filter((u) => u.role === "admin" || u.role === "support")
    .map((u) => u.email.getValue());
}

export class SubmitPharmacyClaim {
  constructor(
    private readonly claimRepo: IPharmacyClaimRepository,
    private readonly pharmacyRepo: IPharmacyRepository,
    private readonly userRepo: IUserRepository,
    private readonly mailer: IMailer,
  ) {}

  async execute(userId: string, input: CreatePharmacyClaimInput): Promise<{ id: string }> {
    const pharmacy = await this.pharmacyRepo.findById(input.pharmacyId);
    if (!pharmacy) throw new AppError("Pharmacie introuvable", 404, "PHARMACY_NOT_FOUND");

    const submitter = await this.userRepo.findById(userId);
    if (!submitter) throw new AppError("Utilisateur introuvable", 404, "USER_NOT_FOUND");

    const claim = PharmacyClaim.create({
      pharmacyId: input.pharmacyId,
      pharmacyName: pharmacy.name,
      submittedBy: userId,
      submittedByEmail: submitter.email.getValue(),
      contactInfo: input.contactInfo,
      proofImages: input.proofImages ?? [],
    });

    const saved = await this.claimRepo.save(claim);

    try {
      const adminEmails = await resolveAdminEmails(this.userRepo);
      const { subject, html } = newPharmacyClaimEmailTemplate({
        pharmacyName: pharmacy.name,
        submitterEmail: submitter.email.getValue(),
        reviewUrl: `${FRONTEND_URL}/backoffice`,
      });
      await Promise.all(
        adminEmails.map((email) => this.mailer.sendEmail(email, subject, html)),
      );
    } catch (e) {
      console.error("Failed to notify admins of new pharmacy claim:", e);
    }

    return { id: saved.id! };
  }
}
