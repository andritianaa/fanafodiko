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

  // Sync methods
  /** Retourne toutes les tâches PENDING dont l'heure est dans le futur */
  findFuturePending(afterDate: Date): Promise<MedicationTask[]>;
  /** Supprime les tâches futures non encore notifiées pour un médicament (pour régénérer après modif) */
  deleteUnnotifiedFutureByMedicationId(medicationId: string, afterDate: Date): Promise<void>;
  /** Supprime toutes les tâches futures PENDING pour un médicament (désactivation / suppression) */
  deleteFuturePendingByMedicationId(medicationId: string, afterDate: Date): Promise<void>;
  /** Supprime une tâche par son id */
  deleteById(id: string): Promise<void>;
}
