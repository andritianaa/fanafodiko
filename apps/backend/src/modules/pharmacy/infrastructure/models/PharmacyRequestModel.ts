import { model, Schema } from "mongoose";

const payloadSchema = new Schema(
  {
    name: String,
    address: String,
    landmark: String,
    coordinates: { lat: Number, lng: Number },
    contacts: [{ type: { type: String }, label: String, value: String }],
    city: String,
    region: String,
    isOpen24h: { type: Boolean, default: false },
    openingHours: [
      { day: Number, open: String, close: String, isClosed: Boolean },
    ],
  },
  { _id: false }
);

interface IRequestDoc {
  submittedBy: string;
  payload: any;
  wantsToManage: boolean;
  proofImages: string[];
  status: string;
  managementStatus: string;
  rejectionReason?: string;
  createdPharmacyId?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

const requestSchema = new Schema<IRequestDoc>({
  submittedBy: { type: String, required: true, index: true },
  payload: { type: payloadSchema, required: true },
  wantsToManage: { type: Boolean, default: false },
  proofImages: { type: [String], default: [] },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    index: true,
  },
  managementStatus: {
    type: String,
    enum: ["none", "pending", "approved", "rejected"],
    default: "none",
  },
  rejectionReason: { type: String },
  createdPharmacyId: { type: String },
  reviewedBy: { type: String },
  reviewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export const PharmacyRequestModel = model<IRequestDoc>(
  "PharmacyRequest",
  requestSchema
);
