import { Cron } from 'croner';
import { GenerateUpcomingTasks } from '../../application/use-cases/GenerateUpcomingTasks';
import { AutoMarkMissedTasks } from '../../application/use-cases/AutoMarkMissedTasks';

export function setupPlanningCron(
  generateUpcomingTasks: GenerateUpcomingTasks,
  autoMarkMissedTasks: AutoMarkMissedTasks
) {
  console.log("Initializing cron jobs...");

  // Every hour: Generate tasks for the next 24h
  const generateJob = new Cron("0 * * * *", async () => {
    try {
      await generateUpcomingTasks.execute({ windowInHours: 24 });
    } catch (error) {
      console.error("Error in GenerateUpcomingTasks job:", error);
    }
  });

  // Every 30 min: marks tasks as MISSED if 2h have passed since scheduled time (grace period)
  const missedJob = new Cron("*/30 * * * *", async () => {
    try {
      await autoMarkMissedTasks.execute();
    } catch (error) {
      console.error("Error in AutoMarkMissedTasks job:", error);
    }
  });

  console.log(`Cron jobs scheduled. Next generation: ${generateJob.nextRun()}, Next missed check: ${missedJob.nextRun()}`);
}
