import mongoose, { Schema, Document } from "mongoose";
import { TaskStatus } from "../../domain/entities/MedicationTask";

export interface IMedicationTaskDocument extends Document {
  medicationId: string;
  profileId: string;
  scheduledAt: Date;
  status: string;
  takenAt?: Date;
  notifiedAt?: Date;
  uniqueHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicationTaskSchema = new Schema<IMedicationTaskDocument>(
  {
    medicationId: { type: String, required: true, index: true },
    profileId: { type: String, required: true, index: true },
    scheduledAt: { type: Date, required: true },
    status: { 
      type: String, 
      enum: Object.values(TaskStatus), 
      default: TaskStatus.PENDING 
    },
    takenAt: { type: Date },
    notifiedAt: { type: Date },
    uniqueHash: { type: String },
  },
  { timestamps: true }
);

// Compound index for idempotency and quick lookups
MedicationTaskSchema.index({ medicationId: 1, scheduledAt: 1 }, { unique: true });
// Index for querying pending tasks
MedicationTaskSchema.index({ status: 1, scheduledAt: 1 });
// Index for hashing if we use it, though compound index above covers uniqueness
MedicationTaskSchema.index({ uniqueHash: 1 }, { unique: true, sparse: true });

export const MedicationTaskModel = mongoose.models.MedicationTask || mongoose.model<IMedicationTaskDocument>("MedicationTask", MedicationTaskSchema);
