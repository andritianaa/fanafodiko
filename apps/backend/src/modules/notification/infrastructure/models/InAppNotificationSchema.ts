import { Schema, model, Document } from "mongoose";

export interface IInAppNotificationDocument extends Document {
  profileId: string;
  type?: 'medication_reminder' | 'search_response';
  taskId?: string;
  medicationName: string;
  dosage?: string;
  scheduledAt?: Date;
  pharmacyName?: string;
  hasStock?: boolean;
  searchId?: string;
  message: string;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
}

const InAppNotificationSchema = new Schema<IInAppNotificationDocument>(
  {
    profileId: { type: String, required: true, index: true },
    type: { type: String, enum: ['medication_reminder', 'search_response'], default: 'medication_reminder' },
    taskId: { type: String, required: false },
    medicationName: { type: String, required: true },
    dosage: { type: String, required: false },
    scheduledAt: { type: Date, required: false },
    pharmacyName: { type: String, required: false },
    hasStock: { type: Boolean, required: false },
    searchId: { type: String, required: false },
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
