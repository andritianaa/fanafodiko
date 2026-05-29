import { Schema, model, Document } from "mongoose";

export interface IInAppNotificationDocument extends Document {
  profileId: string;
  taskId?: string;
  medicationName: string;
  dosage: string;
  scheduledAt: Date;
  message: string;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
}

const InAppNotificationSchema = new Schema<IInAppNotificationDocument>(
  {
    profileId: { type: String, required: true, index: true },
    taskId: { type: String, required: false },
    medicationName: { type: String, required: true },
    dosage: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, required: true, default: false },
    readAt: { type: Date, required: false },
  },
  {
    timestamps: true,
    collection: "in_app_notifications",
  }
);

// Compound index for efficient unread queries
InAppNotificationSchema.index({ profileId: 1, read: 1 });

// Index for sorting by creation date
InAppNotificationSchema.index({ createdAt: -1 });

export const InAppNotificationModel = model<IInAppNotificationDocument>(
  "InAppNotification",
  InAppNotificationSchema
);
