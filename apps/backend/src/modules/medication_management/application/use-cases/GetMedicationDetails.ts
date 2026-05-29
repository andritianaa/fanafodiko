import { AppError } from "@/core/errors/AppError";
import { Medication } from "../../domain/entities/Medication";
import { IMedicationRepository } from "../../domain/repositories/IMedicationRepository";
import { IProfileRepository } from "@/modules/identity/domain/repositories/IProfileRepository";

export class GetMedicationDetails {
    constructor(
        private readonly medicationRepository: IMedicationRepository,
        private readonly profileRepository: IProfileRepository
    ) {}

    async execute(userId: string, medicationId: string): Promise<Medication> {
        const medication = await this.medicationRepository.findById(medicationId);
        if (!medication) {
            throw new AppError("Medication not found", 404, "MEDICATION_NOT_FOUND");
        }

        // Validate access
        const profile = await this.profileRepository.findById(medication.profileId);
        if (profile?.accountId !== userId) {
             throw new AppError("Unauthorized access", 403, "UNAUTHORIZED");
        }

        return medication;
    }
}
