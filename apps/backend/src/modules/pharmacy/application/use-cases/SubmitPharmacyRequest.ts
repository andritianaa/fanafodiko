import { IMailer } from "@/core/services/mailing/IMailer";
import { newPharmacyRequestEmailTemplate } from "@/core/services/mailing/emailTemplates";
import { IUserRepository } from "@/modules/identity/domain/repositories/IUserRepository";
import { PharmacyRequest } from "../../domain/entities/PharmacyRequest";
import { IPharmacyRequestRepository } from "../../domain/repositories/IPharmacyRequestRepository";
import type { CreatePharmacyRequestInput } from "@ext/schemas";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/** Destinataire des notifications : env explicite, sinon premiers admins/support. */
async function resolveAdminEmails(userRepo: IUserRepository): Promise<string[]> {
  const envEmail = process.env.PLATFORM_ADMIN_EMAIL;
  if (envEmail) return [envEmail];
  const users = await userRepo.findAll();
  return users
    .filter((u) => u.role === "admin" || u.role === "support")
    .map((u) => u.email.getValue());
}

export class SubmitPharmacyRequest {
  constructor(
    private readonly requestRepo: IPharmacyRequestRepository,
    private readonly userRepo: IUserRepository,
    private readonly mailer: IMailer
  ) {}

  async execute(
    userId: string,
    input: CreatePharmacyRequestInput
  ): Promise<{ id: string }> {
    const { wantsToManage, proofImages, ...payload } = input;

    const request = PharmacyRequest.create({
      submittedBy: userId,
      payload: {
        name: payload.name,
        address: payload.address,
        landmark: payload.landmark,
        coordinates: payload.coordinates,
        contacts: payload.contacts ?? [],
        city: payload.city,
        region: payload.region,
        isOpen24h: payload.isOpen24h ?? false,
        openingHours: payload.openingHours ?? [],
      },
      wantsToManage: wantsToManage ?? false,
      proofImages: proofImages ?? [],
      status: "pending",
      managementStatus: wantsToManage ? "pending" : "none",
    });

    const saved = await this.requestRepo.save(request);

    // Notifie les admins plateforme (best-effort)
    try {
      const submitter = await this.userRepo.findById(userId);
      const adminEmails = await resolveAdminEmails(this.userRepo);
      const { subject, html } = newPharmacyRequestEmailTemplate({
        pharmacyName: payload.name,
        submitterEmail: submitter?.email.getValue() ?? "inconnu",
        wantsToManage: wantsToManage ?? false,
        reviewUrl: `${FRONTEND_URL}/backoffice`,
      });
      await Promise.all(
        adminEmails.map((email) => this.mailer.sendEmail(email, subject, html))
      );
    } catch (e) {
      console.error("Failed to notify admins of new pharmacy request:", e);
    }

    return { id: saved.id! };
  }
}
