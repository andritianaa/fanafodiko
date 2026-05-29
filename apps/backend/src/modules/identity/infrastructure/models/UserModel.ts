import { model, Schema } from "mongoose";

interface IUserDoc {
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const userSchema = new Schema<IUserDoc>({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = model<IUserDoc>("User", userSchema);
