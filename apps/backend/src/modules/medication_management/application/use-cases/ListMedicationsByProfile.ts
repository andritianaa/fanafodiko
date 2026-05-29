import { AppError } from "@/core/errors/AppError";
import { Medication } from "../../domain/entities/Medication";
import { IMedicationRepository } from "../../domain/repositories/IMedicationRepository";
import { IProfileRepository } from "@/modules/identity/domain/repositories/IProfileRepository";

export class ListMedicationsByProfile {
    constructor(
        private readonly medicationRepository: IMedicationRepository,
        private readonly profileRepository: IProfileRepository
    ) {}

    async execute(userId: string, profileId: string | string[]): Promise<Medication[]> {
        const ids = Array.isArray(profileId) ? profileId : [profileId];

        for (const id of ids) {
            const profile = await this.profileRepository.findById(id);
            if (!profile) {
                throw new AppError(`Profile not found: ${id}`, 404, "PROFILE_NOT_FOUND");
            }
            if (profile.accountId !== userId) {
                throw new AppError("Unauthorized access", 403, "UNAUTHORIZED");
            }
        }

        return this.medicationRepository.findByProfileId(profileId);
    }
}
