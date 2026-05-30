import { AppError } from "@/core/errors/AppError";
import { Medication } from "../../domain/entities/Medication";
import { IMedicationRepository } from "../../domain/repositories/IMedicationRepository";
import { IProfileRepository } from "@/modules/identity/domain/repositories/IProfileRepository";
import { FrequencyProps } from "../../domain/value-objects/Frequency";

export interface UpdateMedicationDTO {
    userId: string;
    medicationId: string;
    updates: {
        name?: string;
        dosage?: string;
        frequency?: FrequencyProps;
        startDate?: Date;
        endDate?: Date | null;
        utcOffsetMinutes?: number;
    }
}

export class UpdateMedication {
    constructor(
        private readonly medicationRepository: IMedicationRepository,
        private readonly profileRepository: IProfileRepository
    ) {}

    async execute(dto: UpdateMedicationDTO): Promise<Medication> {
        const medication = await this.medicationRepository.findById(dto.medicationId);
        if (!medication) {
            throw new AppError("Medication not found", 404, "MEDICATION_NOT_FOUND");
        }

        const profile = await this.profileRepository.findById(medication.profileId);
        if (!profile) {
             throw new AppError("Profile associated with medication not found", 404, "PROFILE_NOT_FOUND");
        }

        if (profile.accountId !== dto.userId) {
            throw new AppError("Unauthorized access", 403, "UNAUTHORIZED");
        }

        medication.update(dto.updates);

        const updated = await this.medicationRepository.save(medication);



        return updated;
    }
}
