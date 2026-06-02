import { model, Schema } from "mongoose";
import { USER_ROLES } from "../../domain/value-objects/UserRole";

export interface INotificationPreferences {
  emailMedicationReminders: boolean;
  emailMedSearchResponse: boolean;
  emailPharmacyInvitation: boolean;
}

interface IUserDoc {
  email: string;
  passwordHash: string;
  role: string;
  pushTokens: string[];
  notificationPreferences: INotificationPreferences;
  createdAt: Date;
}

const userSchema = new Schema<IUserDoc>({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: USER_ROLES, default: "user" },
  pushTokens: { type: [String], default: [] },
  notificationPreferences: {
    type: {
      emailMedicationReminders: { type: Boolean, default: true },
      emailMedSearchResponse: { type: Boolean, default: true },
      emailPharmacyInvitation: { type: Boolean, default: true },
    },
    default: () => ({
      emailMedicationReminders: true,
      emailMedSearchResponse: true,
      emailPharmacyInvitation: true,
    }),
  },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = model<IUserDoc>("User", userSchema);
