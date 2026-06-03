import { Types } from "mongoose";
import { Pharmacy, GuardSchedule, OpeningHour, PharmacyContact, ExceptionalSchedule, PharmacyGuardEntry } from "../../domain/entities/Pharmacy";
import { IPharmacyRepository, PharmacyFilter } from "../../domain/repositories/IPharmacyRepository";
import { PharmacyModel } from "../models/PharmacyModel";

function docToDomain(doc: any): Pharmacy {
  return Pharmacy.reconstitute({
    id: doc._id?.toString(),
    name: doc.name,
    address: doc.address,
    landmark: doc.landmark,
    coordinates: {
      lat: doc.location.coordinates[1],
      lng: doc.location.coordinates[0],
    },
    phone: doc.phone,
    contacts: (doc.contacts ?? []) as PharmacyContact[],
    images: (doc.images ?? []) as string[],
    city: doc.city,
    region: doc.region,
    isOpen24h: doc.isOpen24h ?? false,
    openingHours: (doc.openingHours ?? []) as OpeningHour[],
    guardSchedules: (doc.guardSchedules ?? []) as GuardSchedule[],
    exceptionalSchedules: (doc.exceptionalSchedules ?? []).map((e: any) => ({
      id: e._id?.toString() ?? e.id,
      type: e.type,
      label: e.label,
      startDate: e.startDate,
      endDate: e.endDate,
      startTime: e.startTime,
      endTime: e.endTime,
      reason: e.reason,
    })) as ExceptionalSchedule[],
    pharmacyGuards: (doc.pharmacyGuards ?? []).map((g: any) => ({
      id: g._id?.toString() ?? g.id,
      startDate: g.startDate,
      endDate: g.endDate,
      label: g.label,
      isActive: g.isActive,
    })) as PharmacyGuardEntry[],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
}

function domainToDoc(pharmacy: Pharmacy) {
  return {
    _id: pharmacy.id || new Types.ObjectId().toString(),
    name: pharmacy.props.name,
    address: pharmacy.props.address,
    landmark: pharmacy.props.landmark,
    location: {
      type: "Point" as const,
      coordinates: [pharmacy.props.coordinates.lng, pharmacy.props.coordinates.lat],
    },
    phone: pharmacy.props.phone,
    contacts: pharmacy.props.contacts ?? [],
    images: pharmacy.props.images ?? [],
    city: pharmacy.props.city,
    region: pharmacy.props.region,
    isOpen24h: pharmacy.props.isOpen24h,
    openingHours: pharmacy.props.openingHours,
    guardSchedules: pharmacy.props.guardSchedules,
    exceptionalSchedules: (pharmacy.props.exceptionalSchedules ?? []).map((e) => ({
      _id: e.id,
      type: e.type,
      label: e.label,
      startDate: e.startDate,
      endDate: e.endDate,
      startTime: e.startTime,
      endTime: e.endTime,
      reason: e.reason,
    })),
    pharmacyGuards: (pharmacy.props.pharmacyGuards ?? []).map((g) => ({
      _id: g.id,
      startDate: g.startDate,
      endDate: g.endDate,
      label: g.label,
      isActive: g.isActive,
    })),
  };
}

export class MongoPharmacyRepository implements IPharmacyRepository {
  async findAll(filter?: PharmacyFilter): Promise<Pharmacy[]> {
    const query: any = {};
    if (filter?.only24h) query.isOpen24h = true;
    if (filter?.onlyGuard) {
      const now = new Date();
      const guardMatch = { isActive: true, startDate: { $lte: now }, endDate: { $gte: now } };
      query["$or"] = [
        { guardSchedules: { $elemMatch: guardMatch } },
        { pharmacyGuards: { $elemMatch: guardMatch } },
      ];
    }
    const docs = await PharmacyModel.find(query).lean();
    return docs.map(docToDomain);
  }

  async findById(id: string): Promise<Pharmacy | null> {
    const doc = await PharmacyModel.findById(id).lean();
    return doc ? docToDomain(doc) : null;
  }

  async search(query: string): Promise<Pharmacy[]> {
    const docs = await PharmacyModel.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { city: { $regex: query, $options: "i" } },
        { address: { $regex: query, $options: "i" } },
      ],
    })
      .limit(10)
      .lean();
    return docs.map(docToDomain);
  }

  async save(pharmacy: Pharmacy): Promise<Pharmacy> {
    const data = domainToDoc(pharmacy);
    await PharmacyModel.updateOne({ _id: data._id }, { $set: data }, { upsert: true });
    // Retourner l'entité avec l'id généré si elle n'en avait pas encore
    if (!pharmacy.id) {
      return Pharmacy.reconstitute({ ...pharmacy.props, id: String(data._id) });
    }
    return pharmacy;
  }

  async update(pharmacy: Pharmacy): Promise<Pharmacy> {
    const data = domainToDoc(pharmacy);
    await PharmacyModel.updateOne({ _id: data._id }, { $set: data });
    return pharmacy;
  }

  async delete(id: string): Promise<void> {
    await PharmacyModel.findByIdAndDelete(id);
  }
}
