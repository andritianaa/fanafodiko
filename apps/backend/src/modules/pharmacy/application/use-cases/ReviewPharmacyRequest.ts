import { AppError } from "@/core/errors/AppError";
import { IMailer } from "@/core/services/mailing/IMailer";
import { pharmacyRequestDecisionEmailTemplate } from "@/core/services/mailing/emailTemplates";
import { IUserRepository } from "@/modules/identity/domain/repositories/IUserRepository";
import { Pharmacy } from "../../domain/entities/Pharmacy";
import { PharmacyMembership } from "../../domain/entities/PharmacyMembership";
import { IPharmacyRepository } from "../../domain/repositories/IPharmacyRepository";
import { IPharmacyRequestRepository } from "../../domain/repositories/IPharmacyRequestRepository";
import { IPharmacyMembershipRepository } from "../../domain/repositories/IPharmacyMembershipRepository";

async function notifySubmitter(
  userRepo: IUserRepository,
  mailer: IMailer,
  userId: string,
  opts: {
    pharmacyName: string;
    approved: boolean;
    managementApproved?: boolean;
    reason?: string;
  }
) {
  try {
    const user = await userRepo.findById(userId);
    if (!user) return;
    const { subject, html } = pharmacyRequestDecisionEmailTemplate(opts);
    await mailer.sendEmail(user.email.getValue(), subject, html);
  } catch (e) {
    console.error("Failed to notify submitter:", e);
  }
}

export class ListPharmacyRequests {
  constructor(private readonly requestRepo: IPharmacyRequestRepository) {}

  async execute(userRepo: IUserRepository) {
    const requests = await this.requestRepo.findAll();
    return Promise.all(
      requests.map(async (r) => {
        const submitter = await userRepo.findById(r.submittedBy);
        return {
          id: r.id!,
          payload: r.props.payload,
          submittedByEmail: submitter?.email.getValue() ?? "(compte supprimé)",
          wantsToManage: r.props.wantsToManage,
          proofImages: r.props.proofImages,
          status: r.props.status,
          managementStatus: r.props.managementStatus,
          rejectionReason: r.props.rejectionReason,
          createdPharmacyId: r.props.createdPharmacyId,
          createdAt:
            r.props.createdAt?.toISOString() ?? new Date().toISOString(),
        };
      })
    );
  }
}

export class ApprovePharmacyRequest {
  constructor(
    private readonly requestRepo: IPharmacyRequestRepository,
    private readonly pharmacyRepo: IPharmacyRepository,
    private readonly userRepo: IUserRepository,
    private readonly mailer: IMailer
  ) {}

  async execute(requestId: string, reviewerId: string): Promise<{ pharmacyId: string }> {
    const request = await this.requestRepo.findById(requestId);
    if (!request) throw new AppError("Demande introuvable", 404, "NOT_FOUND");
    if (request.props.status !== "pending") {
      throw new AppError("Demande déjà traitée", 400, "ALREADY_REVIEWED");
    }

    const p = request.props.payload;
    const pharmacy = Pharmacy.create({
      name: p.name,
      address: p.address,
      landmark: p.landmark,
      coordinates: p.coordinates,
      contacts: p.contacts ?? [],
      images: [],
      city: p.city,
      region: p.region,
      isOpen24h: p.isOpen24h,
      openingHours: p.openingHours ?? [],
      guardSchedules: [],
    });
    const saved = await this.pharmacyRepo.save(pharmacy);

    await this.requestRepo.update(
      request.update({
        status: "approved",
        createdPharmacyId: saved.id,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      })
    );

    await notifySubmitter(this.userRepo, this.mailer, request.submittedBy, {
      pharmacyName: p.name,
      approved: true,
      managementApproved: false,
    });

    return { pharmacyId: saved.id! };
  }
}

export class RejectPharmacyRequest {
  constructor(
    private readonly requestRepo: IPharmacyRequestRepository,
    private readonly userRepo: IUserRepository,
    private readonly mailer: IMailer
  ) {}

  async execute(requestId: string, reviewerId: string, reason?: string): Promise<void> {
    const request = await this.requestRepo.findById(requestId);
    if (!request) throw new AppError("Demande introuvable", 404, "NOT_FOUND");
    if (request.props.status !== "pending") {
      throw new AppError("Demande déjà traitée", 400, "ALREADY_REVIEWED");
    }

    await this.requestRepo.update(
      request.update({
        status: "rejected",
        managementStatus: request.props.wantsToManage ? "rejected" : "none",
        rejectionReason: reason,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      })
    );

    await notifySubmitter(this.userRepo, this.mailer, request.submittedBy, {
      pharmacyName: request.props.payload.name,
      approved: false,
      reason,
    });
  }
}

export class ReviewManagement {
  constructor(
    private readonly requestRepo: IPharmacyRequestRepository,
    private readonly membershipRepo: IPharmacyMembershipRepository,
    private readonly userRepo: IUserRepository,
    private readonly mailer: IMailer
  ) {}

  /** Approuve ou refuse la demande de gestion (le demandeur devient superadmin). */
  async execute(requestId: string, approve: boolean): Promise<void> {
    const request = await this.requestRepo.findById(requestId);
    if (!request) throw new AppError("Demande introuvable", 404, "NOT_FOUND");
    if (!request.props.wantsToManage) {
      throw new AppError("Aucune demande de gestion pour cette pharmacie", 400, "NO_MANAGEMENT_REQUEST");
    }
    if (request.props.status !== "approved" || !request.props.createdPharmacyId) {
      throw new AppError(
        "La pharmacie doit d'abord être approuvée",
        400,
        "PHARMACY_NOT_APPROVED"
      );
    }
    if (request.props.managementStatus !== "pending") {
      throw new AppError("Demande de gestion déjà traitée", 400, "ALREADY_REVIEWED");
    }

    if (approve) {
      const membership = PharmacyMembership.create({
        pharmacyId: request.props.createdPharmacyId,
        userId: request.submittedBy,
        role: "superadmin",
      });
      await this.membershipRepo.save(membership);
    }

    await this.requestRepo.update(
      request.update({ managementStatus: approve ? "approved" : "rejected" })
    );

    await notifySubmitter(this.userRepo, this.mailer, request.submittedBy, {
      pharmacyName: request.props.payload.name,
      approved: true,
      managementApproved: approve,
    });
  }
}
