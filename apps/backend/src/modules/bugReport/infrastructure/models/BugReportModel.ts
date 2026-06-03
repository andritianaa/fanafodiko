import mongoose, { Schema, Document } from 'mongoose';

export interface IBugReportDocument extends Document {
  userId: string;
  userEmail: string;
  description: string;
  screenshots: string[];
  deviceInfo: {
    platform: 'web' | 'android' | 'ios';
    browser?: string;
    browserVersion?: string;
    os?: string;
    userAgent?: string;
    screenSize?: string;
    language?: string;
    osVersion?: string;
    appVersion?: string;
  };
  status: 'open' | 'resolved' | 'cancelled';
  adminMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BugReportSchema = new Schema<IBugReportDocument>(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    description: { type: String, required: true },
    screenshots: { type: [String], default: [] },
    deviceInfo: {
      platform: { type: String, enum: ['web', 'android', 'ios'], required: true },
      browser: String,
      browserVersion: String,
      os: String,
      userAgent: String,
      screenSize: String,
      language: String,
      osVersion: String,
      appVersion: String,
    },
    status: {
      type: String,
      enum: ['open', 'resolved', 'cancelled'],
      default: 'open',
    },
    adminMessage: { type: String },
  },
  { timestamps: true }
);

BugReportSchema.index({ status: 1, createdAt: -1 });

export const BugReportModel =
  mongoose.models.BugReport ||
  mongoose.model<IBugReportDocument>('BugReport', BugReportSchema);
