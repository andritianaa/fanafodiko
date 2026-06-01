import { model, Schema } from "mongoose";

interface IMembershipDoc {
  pharmacyId: string;
  userId: string;
  role: string;
  createdAt: Date;
}

const membershipSchema = new Schema<IMembershipDoc>({
  pharmacyId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  role: { type: String, enum: ["superadmin", "admin", "staff"], required: true },
  createdAt: { type: Date, default: Date.now },
});

membershipSchema.index({ pharmacyId: 1, userId: 1 }, { unique: true });

export const PharmacyMembershipModel = model<IMembershipDoc>(
  "PharmacyMembership",
  membershipSchema
);
