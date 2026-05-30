import { EventBus } from "@/core/events/EventBus";
import { ITaskRepository } from "../../domain/repositories/ITaskRepository";

/**
 * Quand un médicament est désactivé :
 * Supprime immédiatement toutes les futures tâches PENDING.
 * Les tâches déjà notifiées (en attente de confirmation) sont aussi supprimées
 * car le traitement est arrêté.
 */
export function setupHandleMedicationDeactivatedHandler(
  eventBus: EventBus,
  taskRepo: ITaskRepository,
) {
  eventBus.subscribe("medication.deactivated", async (event: { medicationId: string }) => {
    const now = new Date();
    try {
      await taskRepo.deleteFuturePendingByMedicationId(event.medicationId, now);
      console.log(`[medication.deactivated] Futures tâches supprimées pour ${event.medicationId}`);
    } catch (error) {
      console.error(`[medication.deactivated] Erreur pour ${event.medicationId}:`, error);
    }
  });
}
