import { IMedicationRepository } from "@/modules/medication_management/domain/repositories/IMedicationRepository";
import { ITaskRepository } from "../../domain/repositories/ITaskRepository";
import { TaskGeneratorService } from "../../domain/services/TaskGeneratorService";
import { AppError } from "@/core/errors/AppError";

export interface ScheduleTasksForMedicationInput {
  medicationId: string;
}

export class ScheduleTasksForMedication {
  constructor(
    private readonly medicationRepo: IMedicationRepository,
    private readonly taskRepo: ITaskRepository
  ) {}

  async execute(input: ScheduleTasksForMedicationInput): Promise<void> {
    const med = await this.medicationRepo.findById(input.medicationId);
    if (!med) {
      throw new AppError("Medication not found", 404, "MEDICATION_NOT_FOUND");
    }

    // Generate tasks for next 24h
    const windowStart = new Date();
    const windowEnd = new Date();
    windowEnd.setHours(windowEnd.getHours() + 24);

    const tasks = TaskGeneratorService.generateTasks(med, windowStart, windowEnd);
    
    if (tasks.length > 0) {
      await this.taskRepo.saveMany(tasks);
    }
  }
}
