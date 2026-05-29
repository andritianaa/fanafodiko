import { AppError } from "@/core/errors/AppError";
import { IMedicationRepository } from "../../domain/repositories/IMedicationRepository";
import { IProfileRepository } from "@/modules/identity/domain/repositories/IProfileRepository";

export class DeleteMedication {
    constructor(
        private readonly medicationRepository: IMedicationRepository,
        private readonly profileRepository: IProfileRepository
    ) {}

    async execute(userId: string, medicationId: string): Promise<void> {
        const medication = await this.medicationRepository.findById(medicationId);
        if (!medication) {
            throw new AppError("Medication not found", 404, "MEDICATION_NOT_FOUND");
        }

        const profile = await this.profileRepository.findById(medication.profileId);
        if (profile?.accountId !== userId) {
            throw new AppError("Unauthorized access", 403, "UNAUTHORIZED");
        }

        await this.medicationRepository.delete(medicationId);
    }
}
