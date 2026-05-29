import { MongoMedicationRepository } from "@/modules/medication_management/infrastructure/repositories/MongoMedicationRepository";
import { MongoTaskRepository } from "./repositories/MongoTaskRepository";
import { GenerateUpcomingTasks } from "../application/use-cases/GenerateUpcomingTasks";
import { AutoMarkMissedTasks } from "../application/use-cases/AutoMarkMissedTasks";
import { setupPlanningCron } from "./cron/PlanningCron";
import { EventBus } from "@/core/events/EventBus";
import { ScheduleTasksForMedication } from "../application/use-cases/ScheduleTasksForMedication";
import { setupScheduleTasksForNewMedicationHandler } from "../application/handlers/ScheduleTasksForNewMedicationHandler";

export function initPlanningModule(eventBus: EventBus) {
  const medicationRepo = new MongoMedicationRepository();
  const taskRepo = new MongoTaskRepository();

  const generateUpcomingTasks = new GenerateUpcomingTasks(medicationRepo, taskRepo);
  const autoMarkMissedTasks = new AutoMarkMissedTasks(taskRepo);
  const scheduleTasksForMedication = new ScheduleTasksForMedication(medicationRepo, taskRepo);

  // Initialize Cron Jobs
  setupPlanningCron(generateUpcomingTasks, autoMarkMissedTasks);

  // Initialize Event Handlers
  setupScheduleTasksForNewMedicationHandler(eventBus, scheduleTasksForMedication);
}
