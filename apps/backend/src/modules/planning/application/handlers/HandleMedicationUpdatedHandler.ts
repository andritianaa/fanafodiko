import { EventBus } from "@/core/events/EventBus";
import { ITaskRepository } from "../../domain/repositories/ITaskRepository";
import { ScheduleTasksForMedication } from "../use-cases/ScheduleTasksForMedication";

/**
 * Quand un médicament est modifié (horaires, dates, etc.) :
 *  1. Supprime les futures tâches non encore notifiées (effacement des anciens horaires)
 *  2. Régénère les tâches sur les 24h à venir avec la nouvelle configuration
 */
export function setupHandleMedicationUpdatedHandler(
  eventBus: EventBus,
  taskRepo: ITaskRepository,
  scheduleTasksForMedication: ScheduleTasksForMedication,
) {
  eventBus.subscribe("medication.updated", async (event: { medicationId: string }) => {
    const now = new Date();
    try {
      await taskRepo.deleteUnnotifiedFutureByMedicationId(event.medicationId, now);
      await scheduleTasksForMedication.execute({ medicationId: event.medicationId });
      console.log(`[medication.updated] Tâches resynchronisées pour ${event.medicationId}`);
    } catch (error) {
      console.error(`[medication.updated] Erreur pour ${event.medicationId}:`, error);
    }
  });
}
