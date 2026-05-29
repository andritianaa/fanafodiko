import { ITaskRepository } from "@/modules/planning/domain/repositories/ITaskRepository";

export class MarkExpiredTasksAsMissed {
  constructor(private readonly taskRepo: ITaskRepository) {}

  async execute(): Promise<void> {
    // Tasks are considered expired if they haven't been completed 4h after scheduled time
    const fourHoursAgo = new Date();
    fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

    const expiredTasks = await this.taskRepo.findOverdueTasks(fourHoursAgo);

    if (expiredTasks.length === 0) {
      return;
    }

    for (const task of expiredTasks) {
      task.markAsMissed();
      await this.taskRepo.save(task);
    }
  }
}
