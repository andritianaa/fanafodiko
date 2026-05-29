import { MongoTaskRepository } from "@/modules/planning/infrastructure/repositories/MongoTaskRepository";
import { MongoInAppNotificationRepository } from "./repositories/MongoInAppNotificationRepository";
import { MongoMedicationRepository } from "@/modules/medication_management/infrastructure/repositories/MongoMedicationRepository";
import { MongoProfileRepository } from "@/modules/identity/infrastructure/repositories/ProfileRepository";
import { MongoUserRepository } from "@/modules/identity/infrastructure/repositories/UserRepository";
import { ResendNotificationService } from "./services/ResendNotificationService";
import { InAppNotificationService } from "./services/InAppNotificationService";
import { CompositeNotificationService } from "./services/CompositeNotificationService";
import { NotifyPendingTasks } from "../application/use-cases/NotifyPendingTasks";
import { MarkExpiredTasksAsMissed } from "../application/use-cases/MarkExpiredTasksAsMissed";
import { setupNotificationCron } from "./cron/NotificationCron";

export function initNotificationModule(resendApiKey: string) {
  const taskRepo = new MongoTaskRepository();
  const inAppNotificationRepo = new MongoInAppNotificationRepository();
  const medicationRepo = new MongoMedicationRepository();
  const profileRepo = new MongoProfileRepository();
  const userRepo = new MongoUserRepository();

  const resendService = new ResendNotificationService(resendApiKey);
  const inAppService = new InAppNotificationService(inAppNotificationRepo);

  const compositeService = new CompositeNotificationService([
    resendService,
    inAppService,
  ]);

  const notifyPendingTasks = new NotifyPendingTasks(
    taskRepo,
    compositeService,
    medicationRepo,
    profileRepo,
    userRepo
  );
  const markExpiredTasksAsMissed = new MarkExpiredTasksAsMissed(taskRepo);

  setupNotificationCron(notifyPendingTasks, markExpiredTasksAsMissed);

  console.log("Notification module initialized");
}
