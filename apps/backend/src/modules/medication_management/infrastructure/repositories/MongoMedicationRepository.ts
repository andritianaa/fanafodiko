import { IMedicationRepository } from "../../domain/repositories/IMedicationRepository";
import { Medication } from "../../domain/entities/Medication";
import { MedicationModel } from "../models/MedicationSchema";
import { MedicationMapper } from "../mappers/MedicationMapper";
import { AppError } from "@/core/errors/AppError";

export class MongoMedicationRepository implements IMedicationRepository {
  async save(medication: Medication): Promise<Medication> {
    const data = MedicationMapper.toPersistence(medication);
    
    if (medication.id) {
      const doc = await MedicationModel.findByIdAndUpdate(medication.id, data, { new: true });
      if (!doc) {
        throw new AppError("Medication not found to update", 404, "MEDICATION_NOT_FOUND");
      }
      return MedicationMapper.toDomain(doc);
    } else {
      const doc = await MedicationModel.create(data);
      return MedicationMapper.toDomain(doc);
    }
  }

  async findById(id: string): Promise<Medication | null> {
    const doc = await MedicationModel.findById(id);
    if (!doc) return null;
    return MedicationMapper.toDomain(doc);
  }

  async findByProfileId(profileId: string | string[]): Promise<Medication[]> {
    const query = Array.isArray(profileId) ? { profileId: { $in: profileId } } : { profileId };
    const docs = await MedicationModel.find(query);
    return docs.map(doc => MedicationMapper.toDomain(doc));
  }

  async findActiveMedications(): Promise<Medication[]> {
    const now = new Date();
    const docs = await MedicationModel.find({
      isActive: true,
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gt: now } }
      ]
    });
    return docs.map(doc => MedicationMapper.toDomain(doc));
  }

  async delete(id: string): Promise<void> {
    await MedicationModel.findByIdAndDelete(id);
  }
}
