import { model, Schema } from "mongoose";
import { USER_ROLES } from "../../domain/value-objects/UserRole";

interface IUserDoc {
  email: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
}

const userSchema = new Schema<IUserDoc>({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: USER_ROLES, default: "user" },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = model<IUserDoc>("User", userSchema);
