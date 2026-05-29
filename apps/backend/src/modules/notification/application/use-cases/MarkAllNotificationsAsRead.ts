import { IInAppNotificationRepository } from "../../domain/repositories/IInAppNotificationRepository";

export interface MarkAllNotificationsAsReadInput {
  profileId: string;
}

export class MarkAllNotificationsAsRead {
  constructor(private readonly notificationRepo: IInAppNotificationRepository) {}

  async execute(input: MarkAllNotificationsAsReadInput): Promise<void> {
    await this.notificationRepo.markAllAsRead(input.profileId);
  }
}
