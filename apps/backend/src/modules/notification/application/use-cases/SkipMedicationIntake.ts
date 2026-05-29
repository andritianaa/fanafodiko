import { ITaskRepository } from "@/modules/planning/domain/repositories/ITaskRepository";
import { AppError } from "@/core/errors/AppError";

export interface SkipMedicationIntakeInput {
  taskId: string;
}

export class SkipMedicationIntake {
  constructor(private readonly taskRepo: ITaskRepository) {}

  async execute(input: SkipMedicationIntakeInput): Promise<void> {
    const task = await this.taskRepo.findById(input.taskId);

    if (!task) {
      throw new AppError("Task not found", 404, "TASK_NOT_FOUND");
    }

    task.markAsSkipped();
    await this.taskRepo.save(task);
  }
}
