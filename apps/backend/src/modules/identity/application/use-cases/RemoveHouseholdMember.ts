import { AppError } from "@/core/errors/AppError";
import { IProfileRepository } from "../../domain/repositories/IProfileRepository";

export class RemoveHouseholdMember {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(requesterAccountId: string, profileId: string): Promise<void> {
    const profile = await this.profileRepository.findById(profileId);

    if (!profile) {
      throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
    }

    if (profile.accountId !== requesterAccountId) {
      throw new AppError("Unauthorized", 403, "UNAUTHORIZED_ACCESS");
    }

    // Check if profile is Owner (Relationship is 'self')
    // Assuming 'self' means owner/principal
    if (profile.relationship.isSelf()) {
      throw new AppError(
        "Cannot delete the owner profile",
        400,
        "CANNOT_DELETE_OWNER",
      );
    }

    await this.profileRepository.delete(profileId);
  }
}
