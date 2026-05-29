import { ITaskRepository } from "@/modules/planning/domain/repositories/ITaskRepository";
import { INotificationService } from "../../domain/services/INotificationService";
import { IMedicationRepository } from "@/modules/medication_management/domain/repositories/IMedicationRepository";
import { IProfileRepository } from "@/modules/identity/domain/repositories/IProfileRepository";
import { IUserRepository } from "@/modules/identity/domain/repositories/IUserRepository";

export class NotifyPendingTasks {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly notificationService: INotificationService,
    private readonly medicationRepo: IMedicationRepository,
    private readonly profileRepo: IProfileRepository,
    private readonly userRepo: IUserRepository
  ) {}

  async execute(): Promise<void> {
    const currentTime = new Date();

    const tasksToNotify = await this.taskRepo.findTasksToNotify(currentTime);

    if (tasksToNotify.length === 0) {
      return;
    }

    for (const task of tasksToNotify) {
      try {
        const medication = await this.medicationRepo.findById(task.medicationId);
        if (!medication) {
          console.error(`Medication ${task.medicationId} not found for task ${task.id}`);
          continue;
        }

        const profile = await this.profileRepo.findById(task.profileId);
        if (!profile) {
          console.error(`Profile ${task.profileId} not found for task ${task.id}`);
          continue;
        }

        const user = await this.userRepo.findById(profile.accountId);
        const profileEmail = user?.email.getValue();

        await this.notificationService.send({
          profileId: task.profileId,
          medicationName: medication.name,
          dosage: medication.dosage,
          scheduledAt: task.scheduledAt,
          profileEmail,
        });

      } catch (error) {
        console.error(`Failed to send notification for task ${task.id}:`, error);
      }
    }
  }
}
