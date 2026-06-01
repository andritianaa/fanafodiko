import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { UserDTO } from "../dtos/UserDTO";

export class GetCurrentUser {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<UserDTO | null> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return null;
    }

    return {
      id: user.id!,
      email: user.email.getValue(),
      role: user.role,
      createdAt: user.props.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
