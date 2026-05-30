import { AppError } from "@/core/errors/AppError";
import { Medication } from "../../domain/entities/Medication";
import { IMedicationRepository } from "../../domain/repositories/IMedicationRepository";
import { IProfileRepository } from "@/modules/identity/domain/repositories/IProfileRepository";
import { FrequencyProps } from "../../domain/value-objects/Frequency";
import { EventBus } from "@/core/events/EventBus";

export interface CreateMedicationDTO {
  userId: string;
  profileId: string;
  name: string;
  dosage: string;
  frequency: FrequencyProps;
  startDate: Date;
  endDate?: Date;
  utcOffsetMinutes?: number;
}

export class CreateMedication {
  constructor(
    private readonly medicationRepository: IMedicationRepository,
    private readonly profileRepository: IProfileRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(dto: CreateMedicationDTO): Promise<Medication> {
    const profile = await this.profileRepository.findById(dto.profileId);
    
    if (!profile) {
      throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    }

    if (profile.accountId !== dto.userId) {
      throw new AppError("Unauthorized access to profile", 403, "UNAUTHORIZED_PROFILE_ACCESS");
    }

    const medication = Medication.create({
      profileId: dto.profileId,
      name: dto.name,
      dosage: dto.dosage,
      frequency: dto.frequency,
      startDate: dto.startDate,
      endDate: dto.endDate,
      utcOffsetMinutes: dto.utcOffsetMinutes ?? 0,
    });

    const savedMedication = await this.medicationRepository.save(medication);

    this.eventBus.publish("medication.created", {
      medicationId: savedMedication.id,
      profileId: savedMedication.profileId
    });



    return savedMedication;
  }
}
