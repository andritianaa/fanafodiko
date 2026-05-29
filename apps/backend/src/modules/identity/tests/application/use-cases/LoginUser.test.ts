import { describe, it, expect, mock, beforeEach } from "bun:test";
import { LoginUser } from "../../../application/use-cases/LoginUser";
import { User } from "../../../domain/entities/User";
import { Email } from "../../../domain/value-objects/Email";
import { AppError } from "@/core/errors/AppError";

describe("LoginUser", () => {
  let loginUser: LoginUser;
  let mockUserRepository: any;
  let mockPasswordHasher: any;
  let mockTokenService: any;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: mock(),
    };
    mockPasswordHasher = {
      verify: mock(),
    };
    mockTokenService = {
      generate: mock(),
    };

    loginUser = new LoginUser(
      mockUserRepository,
      mockPasswordHasher,
      mockTokenService
    );
  });

  it("should return a token when credentials are valid", async () => {
    const email = "test@example.com";
    const password = "password123";
    const user = User.reconstitute({
      id: "user-id",
      email: Email.create(email),
      passwordHash: "hashed_password",
    });

    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockPasswordHasher.verify.mockResolvedValue(true);
    mockTokenService.generate.mockResolvedValue("jwt_token");

    const result = await loginUser.execute(email, password);

    expect(result).toEqual({ token: "jwt_token" });
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    expect(mockPasswordHasher.verify).toHaveBeenCalledWith(password, "hashed_password");
    expect(mockTokenService.generate).toHaveBeenCalled();
  });

  it("should throw error if user not found", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(loginUser.execute("wrong@example.com", "pass")).rejects.toThrow(AppError);
    await expect(loginUser.execute("wrong@example.com", "pass")).rejects.toThrow("Invalid credentials");
  });

  it("should throw error if password is invalid", async () => {
    const user = User.create({
      email: Email.create("test@example.com"),
      passwordHash: "hashed_password",
    });

    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockPasswordHasher.verify.mockResolvedValue(false);

    await expect(loginUser.execute("test@example.com", "wrongpass")).rejects.toThrow(AppError);
    await expect(loginUser.execute("test@example.com", "wrongpass")).rejects.toThrow("Invalid credentials");
  });
});

