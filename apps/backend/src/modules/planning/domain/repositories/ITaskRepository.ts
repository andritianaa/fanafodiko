import { MedicationTask } from "../entities/MedicationTask";

export interface ITaskRepository {
  save(task: MedicationTask): Promise<MedicationTask>;
  saveMany(tasks: MedicationTask[]): Promise<void>;
  findById(id: string): Promise<MedicationTask | null>;
  findByProfileId(profileId: string | string[], startDate?: Date, endDate?: Date): Promise<MedicationTask[]>;
  findPendingBefore(date: Date): Promise<MedicationTask[]>;
  findByHash(hash: string): Promise<MedicationTask | null>;
  
  // Notification methods
  findTasksToNotify(currentTime: Date): Promise<MedicationTask[]>;
  findOverdueTasks(limitTime: Date): Promise<MedicationTask[]>;
  findByProfileAndDate(profileId: string | string[], date: Date): Promise<MedicationTask[]>;
}
