import { Profile } from "../../domain/entities/Profile";
import { IProfileRepository } from "../../domain/repositories/IProfileRepository";
import { Relationship } from "../../domain/value-objects/Relationship";

export interface AddMemberDTO {
  accountId: string;
  fullName: string;
  relationship: string;
  avatarUrl?: string;
}

export class AddHouseholdMember {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(data: AddMemberDTO): Promise<Profile> {
    const profile = Profile.create({
      accountId: data.accountId,
      fullName: data.fullName,
      relationship: Relationship.create(data.relationship),
      avatarUrl: data.avatarUrl,
    });

    await this.profileRepository.save(profile);
    return profile;
  }
}
