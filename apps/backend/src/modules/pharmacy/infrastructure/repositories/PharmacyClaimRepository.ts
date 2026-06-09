import { AppError } from "@/core/errors/AppError";
import { PharmacyClaim } from "../../domain/entities/PharmacyClaim";
import type { IPharmacyClaimRepository } from "../../domain/repositories/IPharmacyClaimRepository";
import { PharmacyClaimModel } from "../models/PharmacyClaimModel";

function toDomain(doc: any): PharmacyClaim {
  return new PharmacyClaim({
    id:               doc._id.toString(),
    pharmacyId:       doc.pharmacyId,
    pharmacyName:     doc.pharmacyName,
    submittedBy:      doc.submittedBy,
    submittedByEmail: doc.submittedByEmail,
    contactInfo:      doc.contactInfo,
    proofImages:      doc.proofImages ?? [],
    status:           doc.status,
    rejectionReason:  doc.rejectionReason,
    createdAt:        doc.createdAt,
  });
}

export class MongoPharmacyClaimRepository implements IPharmacyClaimRepository {
  async save(claim: PharmacyClaim): Promise<PharmacyClaim> {
    const doc = await PharmacyClaimModel.create({
      pharmacyId:       claim.pharmacyId,
      pharmacyName:     claim.pharmacyName,
      submittedBy:      claim.submittedBy,
      submittedByEmail: claim.submittedByEmail,
      contactInfo:      claim.contactInfo,
      proofImages:      claim.proofImages,
      status:           claim.status,
    });
    return toDomain(doc);
  }

  async findById(id: string): Promise<PharmacyClaim | null> {
    const doc = await PharmacyClaimModel.findById(id).lean();
    return doc ? toDomain(doc) : null;
  }

  async findAll(): Promise<{ claims: PharmacyClaim[]; total: number }> {
    const [docs, total] = await Promise.all([
      PharmacyClaimModel.find().sort({ createdAt: -1 }).lean(),
      PharmacyClaimModel.countDocuments(),
    ]);
    return { claims: docs.map(toDomain), total };
  }

  async update(claim: PharmacyClaim): Promise<PharmacyClaim> {
    const doc = await PharmacyClaimModel.findByIdAndUpdate(
      claim.id,
      { status: claim.status, rejectionReason: claim.rejectionReason },
      { new: true },
    ).lean();
    if (!doc) throw new AppError("Réclamation introuvable", 404, "CLAIM_NOT_FOUND");
    return toDomain(doc);
  }
}
