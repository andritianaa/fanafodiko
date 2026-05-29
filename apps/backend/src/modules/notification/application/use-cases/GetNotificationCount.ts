import { IInAppNotificationRepository } from "../../domain/repositories/IInAppNotificationRepository";

export interface GetNotificationCountInput {
  profileId: string;
}

export class GetNotificationCount {
  constructor(private readonly notificationRepo: IInAppNotificationRepository) {}

  async execute(input: GetNotificationCountInput): Promise<{ unreadCount: number }> {
    const unreadCount = await this.notificationRepo.countUnreadByProfileId(input.profileId);
    return { unreadCount };
  }
}
