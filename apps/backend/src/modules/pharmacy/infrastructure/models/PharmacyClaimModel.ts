import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    pharmacyId:      { type: String, required: true, index: true },
    pharmacyName:    { type: String, required: true },
    submittedBy:     { type: String, required: true, index: true },
    submittedByEmail:{ type: String, required: true },
    contactInfo:     { type: String, required: true },
    proofImages:     { type: [String], default: [] },
    status:          { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    rejectionReason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const PharmacyClaimModel = mongoose.model("PharmacyClaim", schema);
