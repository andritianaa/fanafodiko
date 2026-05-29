import { AppError } from "@/core/errors/AppError";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IPasswordHasher } from "../ports/IPasswordHasher";

export class ChangePassword {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    const isValid = await this.passwordHasher.verify(currentPassword, user.passwordHash);
    if (!isValid) throw new AppError("Mot de passe actuel incorrect", 400, "INVALID_PASSWORD");

    const hash = await this.passwordHasher.hash(newPassword);
    await this.userRepository.save(user.updatePassword(hash));
  }
}
