import { randomUUID } from "node:crypto";
import { AppError } from "@/core/errors/AppError";
import { IMailer } from "@/core/services/mailing/IMailer";
import { pharmacyInvitationEmailTemplate } from "@/core/services/mailing/emailTemplates";
import { IUserRepository } from "@/modules/identity/domain/repositories/IUserRepository";
import { UserModel } from "@/modules/identity/infrastructure/models/UserModel";
import { PharmacyRole } from "../../domain/value-objects/PharmacyRole";
import { PharmacyInvitation, InvitableRole } from "../../domain/entities/PharmacyInvitation";
import { IPharmacyInvitationRepository } from "../../domain/repositories/IPharmacyInvitationRepository";
import { IPharmacyMembershipRepository } from "../../domain/repositories/IPharmacyMembershipRepository";
import { IPharmacyRepository } from "../../domain/repositories/IPharmacyRepository";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const INVITE_TTL_DAYS = 7;

export class InviteMember {
  constructor(
    private readonly invitationRepo: IPharmacyInvitationRepository,
    private readonly membershipRepo: IPharmacyMembershipRepository,
    private readonly userRepo: IUserRepository,
    private readonly pharmacyRepo: IPharmacyRepository,
    private readonly mailer: IMailer
  ) {}

  async execute(
    pharmacyId: string,
    actorRole: PharmacyRole,
    email: string,
    role: InvitableRole
  ): Promise<void> {
    // Inviter un admin requiert d'être superadmin ; inviter un staff requiert admin+
    if (role === "admin" && actorRole !== "superadmin") {
      throw new AppError(
        "Seul un superadmin peut inviter un administrateur",
        403,
        "FORBIDDEN"
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Si l'utilisateur existe déjà et est déjà membre → erreur
    const existingUser = await this.userRepo.findByEmail(normalizedEmail);
    if (existingUser?.id) {
      const existing = await this.membershipRepo.findByPharmacyAndUser(
        pharmacyId,
        existingUser.id
      );
      if (existing) {
        throw new AppError("Cet utilisateur est déjà membre", 409, "ALREADY_MEMBER");
      }
    }

    // Invitation déjà en attente ?
    const pending = await this.invitationRepo.findPendingByPharmacyAndEmail(
      pharmacyId,
      normalizedEmail
    );
    if (pending) {
      throw new AppError("Une invitation est déjà en attente", 409, "ALREADY_INVITED");
    }

    const pharmacy = await this.pharmacyRepo.findById(pharmacyId);
    if (!pharmacy) throw new AppError("Pharmacie introuvable", 404, "NOT_FOUND");

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    const invitation = PharmacyInvitation.create({
      pharmacyId,
      email: normalizedEmail,
      role,
      token,
      invitedBy: actorRole, // info indicative
      status: "pending",
      expiresAt,
    });

    await this.invitationRepo.save(invitation);

    const { subject, html } = pharmacyInvitationEmailTemplate({
      pharmacyName: pharmacy.props.name,
      role,
      acceptUrl: `${FRONTEND_URL}/pharmacy-invitation/${token}`,
    });

    // Respecte la préférence emailPharmacyInvitation si l'utilisateur a déjà un compte
    let sendEmail = true;
    if (existingUser?.id) {
      const userDoc = await UserModel.findById(existingUser.id)
        .select("notificationPreferences")
        .lean();
      if (userDoc?.notificationPreferences?.emailPharmacyInvitation === false) {
        sendEmail = false;
      }
    }

    if (sendEmail) {
      try {
        await this.mailer.sendEmail(normalizedEmail, subject, html);
      } catch (e) {
        console.error("Failed to send invitation email:", e);
        // L'invitation reste valide même si l'email échoue
      }
    }
  }
}
