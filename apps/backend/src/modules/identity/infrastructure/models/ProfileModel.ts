import { model, Schema } from "mongoose";
import { RelationshipType } from "../../domain/value-objects/Relationship";

interface IProfileDoc {
  accountId: Schema.Types.ObjectId;
  fullName: string;
  relationship: RelationshipType;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<IProfileDoc>(
  {
    accountId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fullName: { type: String, required: true, trim: true },
    relationship: {
      type: String,
      required: true,
      enum: ["self", "child", "parent", "other", "spouse", "sibling"],
    },
    avatarUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);


export const ProfileModel = model<IProfileDoc>("Profile", profileSchema);
