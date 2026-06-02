import { IInAppNotificationRepository } from "../../domain/repositories/IInAppNotificationRepository";
import { InAppNotification } from "../../domain/entities/InAppNotification";
import {
  InAppNotificationModel,
  IInAppNotificationDocument,
} from "../models/InAppNotificationSchema";
import { AppError } from "@/core/errors/AppError";

export class MongoInAppNotificationRepository implements IInAppNotificationRepository {
  private toDomain(doc: IInAppNotificationDocument): InAppNotification {
    return InAppNotification.reconstitute({
      id: doc._id.toString(),
      profileId: doc.profileId,
      type: doc.type,
      taskId: doc.taskId,
      medicationName: doc.medicationName,
      dosage: doc.dosage,
      scheduledAt: doc.scheduledAt,
      pharmacyName: doc.pharmacyName,
      hasStock: doc.hasStock,
      searchId: doc.searchId,
      message: doc.message,
      read: doc.read,
      createdAt: doc.createdAt,
      readAt: doc.readAt,
    });
  }

  private toPersistence(notification: InAppNotification): Partial<IInAppNotificationDocument> {
    return {
      profileId: notification.profileId,
      type: notification.type,
      taskId: notification.taskId,
      medicationName: notification.medicationName,
      dosage: notification.dosage,
      scheduledAt: notification.scheduledAt,
      pharmacyName: notification.pharmacyName,
      hasStock: notification.hasStock,
      searchId: notification.searchId,
      message: notification.message,
      read: notification.read,
      readAt: notification.readAt,
    };
  }

  async save(notification: InAppNotification): Promise<InAppNotification> {
    const data = this.toPersistence(notification);

    if (notification.id) {
      const doc = await InAppNotificationModel.findByIdAndUpdate(
        notification.id,
        data,
        { new: true }
      );
      if (!doc) {
        throw new AppError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");
      }
      return this.toDomain(doc);
    }

    const doc = await InAppNotificationModel.create(data);
    return this.toDomain(doc);
  }

  async findById(id: string): Promise<InAppNotification | null> {
    const doc = await InAppNotificationModel.findById(id);
    return doc ? this.toDomain(doc) : null;
  }

  async findByProfileId(profileId: string, limit: number = 50): Promise<InAppNotification[]> {
    const docs = await InAppNotificationModel.find({ profileId })
      .sort({ createdAt: -1 })
      .limit(limit);
    return docs.map((doc) => this.toDomain(doc));
  }

  async findUnreadByProfileId(profileId: string): Promise<InAppNotification[]> {
    const docs = await InAppNotificationModel.find({ profileId, read: false }).sort({
      createdAt: -1,
    });
    return docs.map((doc) => this.toDomain(doc));
  }

  async countUnreadByProfileId(profileId: string): Promise<number> {
    return await InAppNotificationModel.countDocuments({ profileId, read: false });
  }

  async markAllAsRead(profileId: string): Promise<void> {
    await InAppNotificationModel.updateMany(
      { profileId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
  }
}
