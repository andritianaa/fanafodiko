import { AppError } from "@/core/errors/AppError";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { BunPasswordHasher } from "../../infrastructure/security/BunPasswordHasher";
import { ITokenService } from "../ports/ITokenService";

export class LoginUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: BunPasswordHasher,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(
    email: string,
    password: string,
  ): Promise<{ token: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user)
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    const isValid = await this.passwordHasher.verify(
      password,
      user.passwordHash,
    );

    if (!isValid)
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

    const expiresIn = process.env.JWT_EXPIRES_IN || "7300d"; // 20 ans par défaut
    const accessToken = await this.tokenService.generate(
      {
        sub: user.id,
        email: user.email.getValue(),
        role: "owner",
      },
      expiresIn,
    );

    return { token: accessToken };
  }
}
