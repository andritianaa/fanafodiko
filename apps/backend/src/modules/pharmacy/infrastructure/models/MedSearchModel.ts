import { model, Schema } from "mongoose";

const nearbySchema = new Schema(
  { id: String, name: String, distance: Number, coordinates: { lat: Number, lng: Number } },
  { _id: false }
);

const medSearchSchema = new Schema({
  userId: { type: String, required: true, index: true },
  medicationName: { type: String, required: true },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  radiusKm: { type: Number, required: true },
  note: { type: String },
  status: { type: String, enum: ["active", "closed"], default: "active", index: true },
  nearbyPharmacies: [nearbySchema],
  expiresAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

export const MedSearchModel = model("MedSearch", medSearchSchema);

const medSearchResponseSchema = new Schema({
  searchId: { type: String, required: true, index: true },
  pharmacyId: { type: String, required: true },
  pharmacyName: { type: String, required: true },
  respondedByUserId: { type: String, required: true },
  hasStock: { type: Boolean, required: true },
  note: { type: String },
  distance: { type: Number },
  respondedAt: { type: Date, default: Date.now },
});

medSearchResponseSchema.index({ searchId: 1, pharmacyId: 1 }, { unique: true });

export const MedSearchResponseModel = model("MedSearchResponse", medSearchResponseSchema);
