import mongoose, { Schema, Document } from "mongoose";

export interface IMedicationDocument extends Document {
  profileId: string;
  name: string;
  dosage: string;
  frequency: {
    type: string;
    times: string[];
    days?: string[];
  };
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MedicationSchema = new Schema<IMedicationDocument>(
  {
    profileId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: {
      type: { type: String, enum: ['DAILY', 'WEEKLY', 'INTERVAL'], required: true },
      times: { type: [String], required: true },
      days: { type: [String], default: [] },
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const MedicationModel = mongoose.models.Medication || mongoose.model<IMedicationDocument>("Medication", MedicationSchema);
