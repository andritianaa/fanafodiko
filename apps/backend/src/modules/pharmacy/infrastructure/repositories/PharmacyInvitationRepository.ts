import { Types } from "mongoose";
import {
  PharmacyInvitation,
  InvitableRole,
  InvitationStatus,
} from "../../domain/entities/PharmacyInvitation";
import { IPharmacyInvitationRepository } from "../../domain/repositories/IPharmacyInvitationRepository";
import { PharmacyInvitationModel } from "../models/PharmacyInvitationModel";

function toDomain(doc: any): PharmacyInvitation {
  return PharmacyInvitation.reconstitute({
    id: doc._id?.toString(),
    pharmacyId: doc.pharmacyId,
    email: doc.email,
    role: doc.role as InvitableRole,
    token: doc.token,
    invitedBy: doc.invitedBy,
    status: doc.status as InvitationStatus,
    expiresAt: doc.expiresAt,
    createdAt: doc.createdAt,
  });
}

export class MongoPharmacyInvitationRepository
  implements IPharmacyInvitationRepository
{
  async findByToken(token: string): Promise<PharmacyInvitation | null> {
    const doc = await PharmacyInvitationModel.findOne({ token }).lean();
    return doc ? toDomain(doc) : null;
  }

  async findPendingByPharmacyAndEmail(
    pharmacyId: string,
    email: string
  ): Promise<PharmacyInvitation | null> {
    const doc = await PharmacyInvitationModel.findOne({
      pharmacyId,
      email,
      status: "pending",
    }).lean();
    return doc ? toDomain(doc) : null;
  }

  async save(invitation: PharmacyInvitation): Promise<PharmacyInvitation> {
    const id = invitation.id || new Types.ObjectId().toString();
    await PharmacyInvitationModel.updateOne(
      { token: invitation.token },
      {
        $set: {
          _id: id,
          pharmacyId: invitation.props.pharmacyId,
          email: invitation.props.email,
          role: invitation.props.role,
          token: invitation.props.token,
          invitedBy: invitation.props.invitedBy,
          status: invitation.props.status,
          expiresAt: invitation.props.expiresAt,
        },
      },
      { upsert: true }
    );
    return invitation;
  }

  async update(invitation: PharmacyInvitation): Promise<PharmacyInvitation> {
    await PharmacyInvitationModel.updateOne(
      { token: invitation.token },
      { $set: { status: invitation.props.status } }
    );
    return invitation;
  }
}
