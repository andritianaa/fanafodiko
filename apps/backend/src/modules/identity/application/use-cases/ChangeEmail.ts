import { AppError } from "@/core/errors/AppError";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IPasswordHasher } from "../ports/IPasswordHasher";
import { Email } from "../../domain/value-objects/Email";

export class ChangeEmail {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(userId: string, newEmail: string, currentPassword: string): Promise<string> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    const isValid = await this.passwordHasher.verify(currentPassword, user.passwordHash);
    if (!isValid) throw new AppError("Mot de passe incorrect", 400, "INVALID_PASSWORD");

    const existing = await this.userRepository.findByEmail(newEmail);
    if (existing && existing.id !== userId) {
      throw new AppError("Cet email est déjà utilisé", 409, "EMAIL_IN_USE");
    }

    const email = Email.create(newEmail);
    const updated = await this.userRepository.save(user.updateEmail(email));
    return updated.email.getValue();
  }
}
