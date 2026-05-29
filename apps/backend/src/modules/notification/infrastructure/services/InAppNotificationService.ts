import {
  INotificationService,
  NotificationParams,
} from "../../domain/services/INotificationService";
import { IInAppNotificationRepository } from "../../domain/repositories/IInAppNotificationRepository";
import { InAppNotification } from "../../domain/entities/InAppNotification";

export class InAppNotificationService implements INotificationService {
  constructor(private readonly notificationRepo: IInAppNotificationRepository) {}

  async send(params: NotificationParams): Promise<void> {
    try {
      const message = `Rappel: ${params.medicationName} (${params.dosage}) à ${params.scheduledAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;

      const notification = InAppNotification.create({
        profileId: params.profileId,
        medicationName: params.medicationName,
        dosage: params.dosage,
        scheduledAt: params.scheduledAt,
        message,
      });

      await this.notificationRepo.save(notification);

      console.log(
        `In-app notification created for profile ${params.profileId}`
      );
    } catch (error) {
      console.error("Failed to create notification:", error);
      // Don't throw - gracefully handle errors
    }
  }
}
