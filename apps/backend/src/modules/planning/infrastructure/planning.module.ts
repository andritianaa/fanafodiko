import { MongoMedicationRepository } from "@/modules/medication_management/infrastructure/repositories/MongoMedicationRepository";
import { MongoTaskRepository } from "./repositories/MongoTaskRepository";
import { SyncMedicationTasks } from "../application/use-cases/SyncMedicationTasks";
import { AutoMarkMissedTasks } from "../application/use-cases/AutoMarkMissedTasks";
import { setupPlanningCron } from "./cron/PlanningCron";
import { EventBus } from "@/core/events/EventBus";

export function initPlanningModule(eventBus: EventBus) {
  const medicationRepo = new MongoMedicationRepository();
  const taskRepo = new MongoTaskRepository();

  const syncMedicationTasks = new SyncMedicationTasks(medicationRepo, taskRepo);
  const autoMarkMissedTasks = new AutoMarkMissedTasks(taskRepo);

  // Initialize Cron Jobs
  setupPlanningCron(syncMedicationTasks, autoMarkMissedTasks);
}
