import { Types } from "mongoose";
import { PharmacyMembership } from "../../domain/entities/PharmacyMembership";
import { IPharmacyMembershipRepository } from "../../domain/repositories/IPharmacyMembershipRepository";
import { PharmacyRole } from "../../domain/value-objects/PharmacyRole";
import { PharmacyMembershipModel } from "../models/PharmacyMembershipModel";

function toDomain(doc: any): PharmacyMembership {
  return PharmacyMembership.reconstitute({
    id: doc._id?.toString(),
    pharmacyId: doc.pharmacyId,
    userId: doc.userId,
    role: doc.role as PharmacyRole,
    createdAt: doc.createdAt,
  });
}

export class MongoPharmacyMembershipRepository
  implements IPharmacyMembershipRepository
{
  async findByPharmacyAndUser(
    pharmacyId: string,
    userId: string
  ): Promise<PharmacyMembership | null> {
    const doc = await PharmacyMembershipModel.findOne({ pharmacyId, userId }).lean();
    return doc ? toDomain(doc) : null;
  }

  async findByPharmacy(pharmacyId: string): Promise<PharmacyMembership[]> {
    const docs = await PharmacyMembershipModel.find({ pharmacyId }).lean();
    return docs.map(toDomain);
  }

  async findByUser(userId: string): Promise<PharmacyMembership[]> {
    const docs = await PharmacyMembershipModel.find({ userId }).lean();
    return docs.map(toDomain);
  }

  async save(membership: PharmacyMembership): Promise<PharmacyMembership> {
    const id = membership.id || new Types.ObjectId().toString();
    await PharmacyMembershipModel.updateOne(
      { pharmacyId: membership.pharmacyId, userId: membership.userId },
      {
        $set: {
          _id: id,
          pharmacyId: membership.pharmacyId,
          userId: membership.userId,
          role: membership.role,
        },
      },
      { upsert: true }
    );
    return membership;
  }

  async delete(pharmacyId: string, userId: string): Promise<void> {
    await PharmacyMembershipModel.deleteOne({ pharmacyId, userId });
  }
}
