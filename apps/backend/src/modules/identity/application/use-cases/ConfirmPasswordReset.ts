import { AppError } from "@/core/errors/AppError";
import { IResetCodeRepository } from "../../domain/repositories/IResetPasswordRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IPasswordHasher } from "../ports/IPasswordHasher";

export class ConfirmPasswordReset {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly resetCodeRepository: IResetCodeRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(code: string, newPassword: string): Promise<void> {
    const resetCode = await this.resetCodeRepository.findByCode(code);

    if (!resetCode) {
      throw new AppError("Invalid or expired reset code", 400, "INVALID_CODE");
    }

    if (resetCode.isExpired()) {
      await this.resetCodeRepository.delete(code);
      throw new AppError("Invalid or expired reset code", 400, "INVALID_CODE");
    }

    const user = await this.userRepository.findById(resetCode.userId);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const passwordHash = await this.passwordHasher.hash(newPassword);

    const updatedUser = user.updatePassword(passwordHash);

    await this.userRepository.save(updatedUser);
    await this.resetCodeRepository.delete(code);
  }
}
