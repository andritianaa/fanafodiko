import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { UserDTO } from "../dtos/UserDTO";

export class GetAllUsers {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(): Promise<UserDTO[]> {
    const users = await this.userRepository.findAll();
    return users.map((user) => ({
      id: user.id!,
      email: user.email.getValue(),
      role: user.role,
      createdAt: user.props.createdAt?.toISOString() ?? new Date().toISOString(),
    }));
  }
}
