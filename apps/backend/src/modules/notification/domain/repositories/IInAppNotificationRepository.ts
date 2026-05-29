import { InAppNotification } from "../entities/InAppNotification";

export interface IInAppNotificationRepository {
  save(notification: InAppNotification): Promise<InAppNotification>;
  findById(id: string): Promise<InAppNotification | null>;
  findByProfileId(profileId: string, limit?: number): Promise<InAppNotification[]>;
  findUnreadByProfileId(profileId: string): Promise<InAppNotification[]>;
  countUnreadByProfileId(profileId: string): Promise<number>;
  markAllAsRead(profileId: string): Promise<void>;
}
