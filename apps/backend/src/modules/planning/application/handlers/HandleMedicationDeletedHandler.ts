import { EventBus } from "@/core/events/EventBus";
import { ITaskRepository } from "../../domain/repositories/ITaskRepository";

/**
 * Quand un médicament est supprimé :
 * Supprime immédiatement toutes les futures tâches PENDING pour éviter
 * d'envoyer des rappels pour un médicament qui n'existe plus.
 */
export function setupHandleMedicationDeletedHandler(
  eventBus: EventBus,
  taskRepo: ITaskRepository,
) {
  eventBus.subscribe("medication.deleted", async (event: { medicationId: string }) => {
    const now = new Date();
    try {
      await taskRepo.deleteFuturePendingByMedicationId(event.medicationId, now);
      console.log(`[medication.deleted] Futures tâches supprimées pour ${event.medicationId}`);
    } catch (error) {
      console.error(`[medication.deleted] Erreur pour ${event.medicationId}:`, error);
    }
  });
}
