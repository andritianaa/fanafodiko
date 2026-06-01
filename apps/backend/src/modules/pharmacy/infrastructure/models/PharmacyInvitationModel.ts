import { model, Schema } from "mongoose";

interface IInvitationDoc {
  pharmacyId: string;
  email: string;
  role: string;
  token: string;
  invitedBy: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
}

const invitationSchema = new Schema<IInvitationDoc>({
  pharmacyId: { type: String, required: true, index: true },
  email: { type: String, required: true, index: true },
  role: { type: String, enum: ["admin", "staff"], required: true },
  token: { type: String, required: true, unique: true },
  invitedBy: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "expired"],
    default: "pending",
  },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const PharmacyInvitationModel = model<IInvitationDoc>(
  "PharmacyInvitation",
  invitationSchema
);
