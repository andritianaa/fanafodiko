import { EventBus } from "@/core/events/EventBus";
import { ScheduleTasksForMedication } from "../use-cases/ScheduleTasksForMedication";

export function setupScheduleTasksForNewMedicationHandler(
  eventBus: EventBus,
  scheduleTasksForMedication: ScheduleTasksForMedication
) {
  eventBus.subscribe("medication.created", async (event: { medicationId: string }) => {
    console.log(`Received medication.created event for ${event.medicationId}. Generating tasks...`);
    try {
      await scheduleTasksForMedication.execute({ medicationId: event.medicationId });
      console.log(`Immediate tasks generated for ${event.medicationId}.`);
    } catch (error) {
      console.error(`Error generating immediate tasks for ${event.medicationId}:`, error);
    }
  });
}
