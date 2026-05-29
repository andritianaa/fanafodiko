import { IInAppNotificationRepository } from "../../domain/repositories/IInAppNotificationRepository";

export interface GetUnreadNotificationsInput {
  profileId: string;
}

export class GetUnreadNotifications {
  constructor(private readonly notificationRepo: IInAppNotificationRepository) {}

  async execute(input: GetUnreadNotificationsInput) {
    const notifications = await this.notificationRepo.findUnreadByProfileId(input.profileId);
    
    return notifications.map((notif) => ({
      id: notif.id!,
      profileId: notif.profileId,
      taskId: notif.taskId,
      medicationName: notif.medicationName,
      dosage: notif.dosage,
      scheduledAt: notif.scheduledAt.toISOString(),
      message: notif.message,
      read: notif.read,
      createdAt: notif.createdAt?.toISOString() || new Date().toISOString(),
    }));
  }
}
