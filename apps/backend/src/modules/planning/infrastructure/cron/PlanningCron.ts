import { Cron } from 'croner';
import { SyncMedicationTasks } from '../../application/use-cases/SyncMedicationTasks';
import { AutoMarkMissedTasks } from '../../application/use-cases/AutoMarkMissedTasks';

export function setupPlanningCron(
  syncMedicationTasks: SyncMedicationTasks,
  autoMarkMissedTasks: AutoMarkMissedTasks,
) {
  console.log("Initializing planning cron jobs...");

  // Every 5 min: sync tasks with current medication state
  // Handles: new treatments, modified schedules, deactivation, deletion
  const syncJob = new Cron("*/5 * * * *", async () => {
    try {
      await syncMedicationTasks.execute();
    } catch (error) {
      console.error("Error in SyncMedicationTasks job:", error);
    }
  });

  // Every 30 min: marks tasks as MISSED if 2h have passed since scheduled time
  const missedJob = new Cron("*/30 * * * *", async () => {
    try {
      await autoMarkMissedTasks.execute();
    } catch (error) {
      console.error("Error in AutoMarkMissedTasks job:", error);
    }
  });

  console.log(`Planning cron ready. Next sync: ${syncJob.nextRun()}, Next missed check: ${missedJob.nextRun()}`);
}
