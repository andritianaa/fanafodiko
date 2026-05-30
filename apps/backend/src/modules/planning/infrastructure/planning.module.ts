import { MongoMedicationRepository } from "@/modules/medication_management/infrastructure/repositories/MongoMedicationRepository";
import { MongoTaskRepository } from "./repositories/MongoTaskRepository";
import { SyncMedicationTasks } from "../application/use-cases/SyncMedicationTasks";
import { ScheduleTasksForMedication } from "../application/use-cases/ScheduleTasksForMedication";
import { AutoMarkMissedTasks } from "../application/use-cases/AutoMarkMissedTasks";
import { setupPlanningCron } from "./cron/PlanningCron";
import { setupScheduleTasksForNewMedicationHandler } from "../application/handlers/ScheduleTasksForNewMedicationHandler";
import { EventBus } from "@/core/events/EventBus";

export function initPlanningModule(eventBus: EventBus) {
  const medicationRepo = new MongoMedicationRepository();
  const taskRepo = new MongoTaskRepository();

  const syncMedicationTasks = new SyncMedicationTasks(medicationRepo, taskRepo);
  const scheduleTasksForMedication = new ScheduleTasksForMedication(medicationRepo, taskRepo);
  const autoMarkMissedTasks = new AutoMarkMissedTasks(taskRepo);

  // Cron toutes les 5 min : synchronisation complète (mises à jour, désactivations, suppressions)
  setupPlanningCron(syncMedicationTasks, autoMarkMissedTasks);

  // Événement medication.created : génération immédiate des tâches du jour
  setupScheduleTasksForNewMedicationHandler(eventBus, scheduleTasksForMedication);
}
