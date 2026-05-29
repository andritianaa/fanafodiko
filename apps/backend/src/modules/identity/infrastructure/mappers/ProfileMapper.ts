import { Profile } from "../../domain/entities/Profile";
import { Relationship } from "../../domain/value-objects/Relationship";

interface IProfilePersistence {
  _id?: string;
  accountId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
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
      firstName: raw.firstName,
      lastName: raw.lastName,
      dateOfBirth: raw.dateOfBirth,
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
      firstName: profile.firstName,
      lastName: profile.lastName,
      dateOfBirth: profile.dateOfBirth,
      relationship: profile.relationship.getValue(),
      avatarUrl: profile.avatarUrl,
      createdAt: profile.createdAt || new Date(),
      updatedAt: profile.updatedAt || new Date(),
    };
  }
}
