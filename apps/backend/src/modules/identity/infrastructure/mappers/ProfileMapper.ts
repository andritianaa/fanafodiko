import { Profile } from "../../domain/entities/Profile";
import { Relationship } from "../../domain/value-objects/Relationship";

interface IProfilePersistence {
  _id?: string;
  accountId: string;
  fullName: string;
  relationship: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ProfileMapper {
  static toDomain(raw: IProfilePersistence): Profile {
    return Profile.reconstitute({
      id: raw._id?.toString(),
      accountId: raw.accountId.toString(),
      fullName: raw.fullName,
      relationship: Relationship.create(raw.relationship),
      avatarUrl: raw.avatarUrl,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(profile: Profile): IProfilePersistence {
    return {
      _id: profile.id,
      accountId: profile.accountId,
      fullName: profile.fullName,
      relationship: profile.relationship.getValue(),
      avatarUrl: profile.avatarUrl,
      createdAt: profile.createdAt || new Date(),
      updatedAt: profile.updatedAt || new Date(),
    };
  }
}
