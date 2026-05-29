import { Schema, model } from "mongoose";

const sessionSchema = new Schema({
  _id: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 86400 },
  },
});

export const SessionModel = model("Session", sessionSchema);
