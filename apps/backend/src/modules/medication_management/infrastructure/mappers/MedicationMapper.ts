import { Medication } from "../../domain/entities/Medication";
import { IMedicationDocument } from "../models/MedicationSchema";
import { Frequency } from "../../domain/value-objects/Frequency";

export class MedicationMapper {
  static toDomain(raw: IMedicationDocument): Medication {
    return Medication.reconstitute({
      id: raw._id.toString(),
      profileId: raw.profileId,
      name: raw.name,
      dosage: raw.dosage,
      frequency: Frequency.create({
        type: raw.frequency.type as any,
        times: raw.frequency.times,
        days: raw.frequency.days
      }),
      startDate: raw.startDate,
      endDate: raw.endDate ?? null,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    });
  }

  static toPersistence(medication: Medication): any {
    return {
      profileId: medication.profileId,
      name: medication.name,
      dosage: medication.dosage,
      frequency: {
        type: medication.frequency.type,
        times: medication.frequency.times,
        days: medication.frequency.days
      },
      startDate: medication.startDate,
      endDate: medication.endDate,
      isActive: medication.isActive,
      updatedAt: medication.updatedAt
    };
  }
}
