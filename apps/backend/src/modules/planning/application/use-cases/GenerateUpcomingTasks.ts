import { IMedicationRepository } from "@/modules/medication_management/domain/repositories/IMedicationRepository";
import { ITaskRepository } from "../../domain/repositories/ITaskRepository";
import { TaskGeneratorService } from "../../domain/services/TaskGeneratorService";

export interface GenerateUpcomingTasksInput {
  windowInHours: number;
}

export class GenerateUpcomingTasks {
  constructor(
    private readonly medicationRepo: IMedicationRepository,
    private readonly taskRepo: ITaskRepository
  ) {}

  async execute(input: GenerateUpcomingTasksInput): Promise<void> {
    console.log(`Starting generation for the next ${input.windowInHours} hours...`);
    
    // Ftch all active medications
    const medications = await this.medicationRepo.findActiveMedications();
    
    const windowStart = new Date();
    const windowEnd = new Date();
    windowEnd.setHours(windowEnd.getHours() + input.windowInHours);

    for (const med of medications) {
      // Generate tasks based on frequency rules
      const tasks = TaskGeneratorService.generateTasks(med, windowStart, windowEnd);
      
      if (tasks.length > 0) {
        try {
          await this.taskRepo.saveMany(tasks);
        } catch (error) {
          console.error(`Error saving tasks for medication ${med.id}:`, error);
        }
      }
    }
  }
}
