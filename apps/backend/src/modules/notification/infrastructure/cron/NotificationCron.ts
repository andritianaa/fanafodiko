import { Cron } from "croner";
import { NotifyPendingTasks } from "../../application/use-cases/NotifyPendingTasks";
import { MarkExpiredTasksAsMissed } from "../../application/use-cases/MarkExpiredTasksAsMissed";

export function setupNotificationCron(
  notifyPendingTasks: NotifyPendingTasks,
  markExpiredTasksAsMissed: MarkExpiredTasksAsMissed
) {
  console.log("Initializing notification cron jobs...");

  // Alert Worker: Every 5 minutes - check and send notifications
  const alertJob = new Cron("*/5 * * * *", async () => {
    try {
      await notifyPendingTasks.execute();
    } catch (error) {
      console.error("Error in Alert Worker:", error);
    }
  });

  // Cleanup Worker: Every 30 minutes - mark overdue tasks as missed
  const cleanupJob = new Cron("*/30 * * * *", async () => {
    try {
      await markExpiredTasksAsMissed.execute();
    } catch (error) {
      console.error("Error in Cleanup Worker:", error);
    }
  });

  console.log(`Jobs scheduled. Next alert at ${alertJob.nextRun()}, next cleanup at ${cleanupJob.nextRun()}`);
}
