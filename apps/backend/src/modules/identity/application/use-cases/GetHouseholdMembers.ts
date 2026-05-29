import { Profile } from "../../domain/entities/Profile";
import { IProfileRepository } from "../../domain/repositories/IProfileRepository";

export class GetHouseholdMembers {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(accountId: string): Promise<Profile[]> {
    return await this.profileRepository.findAllByAccountId(accountId);
  }
}
