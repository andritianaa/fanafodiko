import { AppError } from "@/core/errors/AppError";
import { Medication } from "../../domain/entities/Medication";
import { IMedicationRepository } from "../../domain/repositories/IMedicationRepository";
import { IProfileRepository } from "@/modules/identity/domain/repositories/IProfileRepository";
import { EventBus } from "@/core/events/EventBus";

export class ToggleMedicationStatus {
    constructor(
        private readonly medicationRepository: IMedicationRepository,
        private readonly profileRepository: IProfileRepository,
        private readonly eventBus: EventBus,
    ) {}

    async execute(userId: string, medicationId: string, isActive: boolean): Promise<Medication> {
        const medication = await this.medicationRepository.findById(medicationId);
        if (!medication) {
            throw new AppError("Medication not found", 404, "MEDICATION_NOT_FOUND");
        }

        const profile = await this.profileRepository.findById(medication.profileId);
        if (profile?.accountId !== userId) {
            throw new AppError("Unauthorized access", 403, "UNAUTHORIZED");
        }

        if (isActive && !medication.isActive) {
            medication.resume();
        } else if (!isActive && medication.isActive) {
            medication.pause();
        }

        const updated = await this.medicationRepository.save(medication);

        if (!isActive) {
            // Désactivation : supprime immédiatement les futures tâches
            this.eventBus.publish("medication.deactivated", { medicationId: updated.id });
        } else {
            // Réactivation : régénère les tâches comme une mise à jour
            this.eventBus.publish("medication.updated", { medicationId: updated.id });
        }

        return updated;
    }
}
