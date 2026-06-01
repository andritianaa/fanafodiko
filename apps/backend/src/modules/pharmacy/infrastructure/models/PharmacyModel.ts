import { model, Schema } from "mongoose";

const openingHourSchema = new Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    open: { type: String },
    close: { type: String },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false }
);

const guardScheduleSchema = new Schema(
  {
    weekIdentifier: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const contactSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["phone", "email", "whatsapp", "facebook", "other"],
      required: true,
    },
    label: { type: String },
    value: { type: String, required: true },
  },
  { _id: false }
);

interface IPharmacyDoc {
  name: string;
  address: string;
  landmark?: string;
  location: { type: "Point"; coordinates: [number, number] }; // [lng, lat] GeoJSON
  phone?: string;
  contacts: { type: string; label?: string; value: string }[];
  images: string[];
  city: string;
  region?: string;
  isOpen24h: boolean;
  openingHours: { day: number; open?: string; close?: string; isClosed: boolean }[];
  guardSchedules: { weekIdentifier: string; startDate: Date; endDate: Date; isActive: boolean }[];
  createdAt: Date;
  updatedAt: Date;
}

const pharmacySchema = new Schema<IPharmacyDoc>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    landmark: { type: String },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    phone: { type: String },
    contacts: { type: [contactSchema], default: [] },
    images: { type: [String], default: [] },
    city: { type: String, required: true },
    region: { type: String },
    isOpen24h: { type: Boolean, default: false },
    openingHours: [openingHourSchema],
    guardSchedules: [guardScheduleSchema],
  },
  { timestamps: true }
);

pharmacySchema.index({ location: "2dsphere" });
pharmacySchema.index({ name: "text", city: "text" });

export const PharmacyModel = model<IPharmacyDoc>("Pharmacy", pharmacySchema);
