import { ITaskRepository } from "@/modules/planning/domain/repositories/ITaskRepository";

export class MarkExpiredTasksAsMissed {
  constructor(private readonly taskRepo: ITaskRepository) {}

  async execute(): Promise<void> {
    // Tasks are considered missed if they haven't been taken 2h after scheduled time.
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    const expiredTasks = await this.taskRepo.findOverdueTasks(twoHoursAgo);

    if (expiredTasks.length === 0) {
      return;
    }

    for (const task of expiredTasks) {
      task.markAsMissed();
      await this.taskRepo.save(task);
    }
  }
}
