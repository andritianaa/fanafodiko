import { ITaskRepository } from "../../domain/repositories/ITaskRepository";
import { TaskStatus } from "../../domain/entities/MedicationTask";
import { AppError } from "@/core/errors/AppError";

export interface UpdateTaskStatusInput {
  taskId: string;
  status: TaskStatus;
}

export class UpdateTaskStatus {
  constructor(private readonly taskRepo: ITaskRepository) {}

  async execute(input: UpdateTaskStatusInput): Promise<void> {
    const task = await this.taskRepo.findById(input.taskId);
    if (!task) {
      throw new AppError("Task not found", 404, "TASK_NOT_FOUND");
    }

    if (input.status === TaskStatus.TAKEN) {
      task.markAsTaken();
    } else if (input.status === TaskStatus.SKIPPED) {
      task.markAsSkipped();
    } else if (input.status === TaskStatus.MISSED) {
      task.markAsMissed();
    }

    await this.taskRepo.save(task);
  }
}
