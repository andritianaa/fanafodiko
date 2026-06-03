import { ITaskRepository } from "@/modules/planning/domain/repositories/ITaskRepository";
import { INotificationService } from "../../domain/services/INotificationService";
import { IMedicationRepository } from "@/modules/medication_management/domain/repositories/IMedicationRepository";
import { IProfileRepository } from "@/modules/identity/domain/repositories/IProfileRepository";
import { IUserRepository } from "@/modules/identity/domain/repositories/IUserRepository";
import { UserModel } from "@/modules/identity/infrastructure/models/UserModel";
import { expoPushService } from "@/core/services/push/ExpoPushService";

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

        const userDoc = await UserModel.findById(profile.accountId)
          .select("pushTokens notificationPreferences")
          .lean();

        await this.notificationService.send({
          profileId: task.profileId,
          medicationName: medication.name,
          dosage: medication.dosage,
          scheduledAt: task.scheduledAt,
          profileEmail,
          utcOffsetMinutes: medication.utcOffsetMinutes,
          emailEnabled: userDoc?.notificationPreferences?.emailMedicationReminders !== false,
        });

        // Push vers les appareils de l'utilisateur (fire-and-forget)
        if (user && userDoc?.pushTokens?.length) {
          expoPushService
            .sendPush(
              userDoc.pushTokens,
              `💊 ${medication.name}`,
              `Rappel : ${medication.dosage}`,
              { type: "medication", taskId: task.id, profileId: task.profileId },
            )
            .catch(() => {});
        }

        // Mark as notified so it is never sent again regardless of cron frequency.
        task.markAsNotified();
        await this.taskRepo.save(task);

      } catch (error) {
        console.error(`Failed to send notification for task ${task.id}:`, error);
      }
    }
  }
}
