import { Types } from "mongoose";
import {
  PharmacyRequest,
  RequestStatus,
  ManagementStatus,
} from "../../domain/entities/PharmacyRequest";
import { IPharmacyRequestRepository } from "../../domain/repositories/IPharmacyRequestRepository";
import { PharmacyRequestModel } from "../models/PharmacyRequestModel";

function toDomain(doc: any): PharmacyRequest {
  return PharmacyRequest.reconstitute({
    id: doc._id?.toString(),
    submittedBy: doc.submittedBy,
    payload: {
      name: doc.payload.name,
      address: doc.payload.address,
      landmark: doc.payload.landmark,
      coordinates: doc.payload.coordinates,
      contacts: doc.payload.contacts ?? [],
      city: doc.payload.city,
      region: doc.payload.region,
      isOpen24h: doc.payload.isOpen24h ?? false,
      openingHours: doc.payload.openingHours ?? [],
    },
    wantsToManage: doc.wantsToManage ?? false,
    proofImages: doc.proofImages ?? [],
    status: doc.status as RequestStatus,
    managementStatus: doc.managementStatus as ManagementStatus,
    rejectionReason: doc.rejectionReason,
    createdPharmacyId: doc.createdPharmacyId,
    reviewedBy: doc.reviewedBy,
    reviewedAt: doc.reviewedAt,
    createdAt: doc.createdAt,
  });
}

function toDoc(r: PharmacyRequest) {
  return {
    _id: r.id || new Types.ObjectId().toString(),
    submittedBy: r.props.submittedBy,
    payload: r.props.payload,
    wantsToManage: r.props.wantsToManage,
    proofImages: r.props.proofImages,
    status: r.props.status,
    managementStatus: r.props.managementStatus,
    rejectionReason: r.props.rejectionReason,
    createdPharmacyId: r.props.createdPharmacyId,
    reviewedBy: r.props.reviewedBy,
    reviewedAt: r.props.reviewedAt,
  };
}

export class MongoPharmacyRequestRepository
  implements IPharmacyRequestRepository
{
  async findById(id: string): Promise<PharmacyRequest | null> {
    const doc = await PharmacyRequestModel.findById(id).lean();
    return doc ? toDomain(doc) : null;
  }

  async findAll(status?: RequestStatus): Promise<PharmacyRequest[]> {
    const query = status ? { status } : {};
    const docs = await PharmacyRequestModel.find(query).sort({ createdAt: -1 }).lean();
    return docs.map(toDomain);
  }

  async save(request: PharmacyRequest): Promise<PharmacyRequest> {
    const data = toDoc(request);
    await PharmacyRequestModel.updateOne(
      { _id: data._id },
      { $set: data },
      { upsert: true }
    );
    return request;
  }

  async update(request: PharmacyRequest): Promise<PharmacyRequest> {
    const data = toDoc(request);
    await PharmacyRequestModel.updateOne({ _id: data._id }, { $set: data });
    return request;
  }

  async delete(id: string): Promise<void> {
    await PharmacyRequestModel.findByIdAndDelete(id);
  }
}
