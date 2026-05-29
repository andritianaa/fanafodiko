import { ITaskRepository } from "@/modules/planning/domain/repositories/ITaskRepository";
import { TaskStatus } from "@/modules/planning/domain/entities/MedicationTask";

export interface GetDailyProgressInput {
  profileId: string | string[];
  date: Date;
}

export interface DailyProgressResult {
  date: string;
  totalTasks: number;
  takenCount: number;
  missedCount: number;
  skippedCount: number;
  pendingCount: number;
  adherenceRate: number; // Percentage: taken / (taken + missed + skipped)
}

export class GetDailyProgress {
  constructor(private readonly taskRepo: ITaskRepository) {}

  async execute(input: GetDailyProgressInput): Promise<DailyProgressResult> {
    const tasks = await this.taskRepo.findByProfileAndDate(input.profileId, input.date);

    const takenCount = tasks.filter((t) => t.status === TaskStatus.TAKEN).length;
    const missedCount = tasks.filter((t) => t.status === TaskStatus.MISSED).length;
    const skippedCount = tasks.filter((t) => t.status === TaskStatus.SKIPPED).length;
    const pendingCount = tasks.filter((t) => t.status === TaskStatus.PENDING).length;

    const completedOrSkipped = takenCount + missedCount + skippedCount;
    const adherenceRate = completedOrSkipped > 0 ? (takenCount / completedOrSkipped) * 100 : 0;

    return {
      date: input.date.toISOString().split("T")[0],
      totalTasks: tasks.length,
      takenCount,
      missedCount,
      skippedCount,
      pendingCount,
      adherenceRate: Math.round(adherenceRate * 100) / 100, // Arondis
    };
  }
}
