import { IInAppNotificationRepository } from "../../domain/repositories/IInAppNotificationRepository";
import { AppError } from "@/core/errors/AppError";

export interface MarkNotificationAsReadInput {
  notificationId: string;
}

export class MarkNotificationAsRead {
  constructor(private readonly notificationRepo: IInAppNotificationRepository) {}

  async execute(input: MarkNotificationAsReadInput): Promise<void> {
    const notification = await this.notificationRepo.findById(input.notificationId);

    if (!notification) {
      throw new AppError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");
    }

    notification.markAsRead();
    await this.notificationRepo.save(notification);
  }
}
