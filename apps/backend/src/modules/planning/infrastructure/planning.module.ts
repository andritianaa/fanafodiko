import { MongoMedicationRepository } from "@/modules/medication_management/infrastructure/repositories/MongoMedicationRepository";
import { MongoTaskRepository } from "./repositories/MongoTaskRepository";
import { SyncMedicationTasks } from "../application/use-cases/SyncMedicationTasks";
import { ScheduleTasksForMedication } from "../application/use-cases/ScheduleTasksForMedication";
import { AutoMarkMissedTasks } from "../application/use-cases/AutoMarkMissedTasks";
import { setupPlanningCron } from "./cron/PlanningCron";
import { setupScheduleTasksForNewMedicationHandler } from "../application/handlers/ScheduleTasksForNewMedicationHandler";
import { setupHandleMedicationUpdatedHandler } from "../application/handlers/HandleMedicationUpdatedHandler";
import { setupHandleMedicationDeactivatedHandler } from "../application/handlers/HandleMedicationDeactivatedHandler";
import { setupHandleMedicationDeletedHandler } from "../application/handlers/HandleMedicationDeletedHandler";
import { EventBus } from "@/core/events/EventBus";

export function initPlanningModule(eventBus: EventBus) {
  const medicationRepo = new MongoMedicationRepository();
  const taskRepo = new MongoTaskRepository();

  const syncMedicationTasks = new SyncMedicationTasks(medicationRepo, taskRepo);
  const scheduleTasksForMedication = new ScheduleTasksForMedication(medicationRepo, taskRepo);
  const autoMarkMissedTasks = new AutoMarkMissedTasks(taskRepo);

  // ── Cron toutes les 5 min : filet de sécurité ─────────────────────────────
  setupPlanningCron(syncMedicationTasks, autoMarkMissedTasks);

  // ── Event handlers : réaction immédiate aux changements ───────────────────
  // Ajout → génération instantanée des tâches du jour
  setupScheduleTasksForNewMedicationHandler(eventBus, scheduleTasksForMedication);
  // Modification → supprime anciennes tâches non notifiées + régénère
  setupHandleMedicationUpdatedHandler(eventBus, taskRepo, scheduleTasksForMedication);
  // Désactivation → supprime toutes les futures tâches PENDING
  setupHandleMedicationDeactivatedHandler(eventBus, taskRepo);
  // Suppression → idem
  setupHandleMedicationDeletedHandler(eventBus, taskRepo);
}
