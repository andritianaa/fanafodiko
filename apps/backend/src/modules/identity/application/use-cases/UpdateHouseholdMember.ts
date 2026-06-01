import { AppError } from "@/core/errors/AppError";
import { Profile } from "../../domain/entities/Profile";
import { IProfileRepository } from "../../domain/repositories/IProfileRepository";

export interface UpdateProfileDTO {
  fullName?: string;
  avatarUrl?: string;
}

export class UpdateHouseholdMember {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(
    requesterAccountId: string,
    profileId: string,
    updates: UpdateProfileDTO,
  ): Promise<Profile> {
    const profile = await this.profileRepository.findById(profileId);

    if (!profile) {
      throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    }

    if (profile.accountId !== requesterAccountId) {
      throw new AppError("Unauthorized", 403, "UNAUTHORIZED_ACCESS");
    }

    const updatedProfile = profile.updateProfile(updates);

    await this.profileRepository.save(updatedProfile);

    return updatedProfile;
  }
}
