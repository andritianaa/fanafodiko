import { model, Schema } from "mongoose";

const resetTokenSchema = new Schema({
  _id: { type: String, required: true },
  code: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 86400 },
  },
});

export const ResetCodeModel = model("ResetCode", resetTokenSchema);
