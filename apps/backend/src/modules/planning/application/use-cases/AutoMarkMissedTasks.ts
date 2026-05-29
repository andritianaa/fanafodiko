import { ITaskRepository } from "../../domain/repositories/ITaskRepository";

export class AutoMarkMissedTasks {
  constructor(private readonly taskRepo: ITaskRepository) {}

  async execute(): Promise<void> {
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    console.log(`Checking for PENDING tasks scheduled before ${twoHoursAgo.toISOString()}`);

    const missedTasks = await this.taskRepo.findPendingBefore(twoHoursAgo);
    
    if (missedTasks.length === 0) {
      return;
    }

    console.log(`Marking ${missedTasks.length} tasks as MISSED.`);

    for (const task of missedTasks) {
      task.markAsMissed();
      await this.taskRepo.save(task);
    }
  }
}
