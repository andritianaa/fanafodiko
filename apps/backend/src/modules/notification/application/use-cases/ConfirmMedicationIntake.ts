import { ITaskRepository } from "@/modules/planning/domain/repositories/ITaskRepository";
import { AppError } from "@/core/errors/AppError";

export interface ConfirmMedicationIntakeInput {
  taskId: string;
}

export class ConfirmMedicationIntake {
  constructor(private readonly taskRepo: ITaskRepository) {}

  async execute(input: ConfirmMedicationIntakeInput): Promise<void> {
    const task = await this.taskRepo.findById(input.taskId);

    if (!task) {
      throw new AppError("Task not found", 404, "TASK_NOT_FOUND");
    }

    task.markAsTaken(new Date());
    await this.taskRepo.save(task);

    console.log(`Task ${input.taskId} marked as TAKEN`);
  }
}
