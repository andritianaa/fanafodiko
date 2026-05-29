import { describe, it, expect, mock, beforeEach } from "bun:test";
import { ConfirmPasswordReset } from "../../../application/use-cases/ConfirmPasswordReset";
import { User } from "../../../domain/entities/User";
import { Email } from "../../../domain/value-objects/Email";
import { AppError } from "@/core/errors/AppError";

describe("ConfirmPasswordReset", () => {
  let confirmPasswordReset: ConfirmPasswordReset;
  let mockUserRepository: any;
  let mockResetCodeRepository: any;
  let mockPasswordHasher: any;

  beforeEach(() => {
    mockUserRepository = {
      findById: mock(),
      save: mock(),
    };
    mockResetCodeRepository = {
      findByCode: mock(),
      delete: mock(),
    };
    mockPasswordHasher = {
      hash: mock(),
    };

    confirmPasswordReset = new ConfirmPasswordReset(
      mockUserRepository,
      mockResetCodeRepository,
      mockPasswordHasher
    );
  });

  it("should reset password successfully", async () => {
    const code = "123456";
    const newPassword = "newPassword";
    const resetCodeMock = {
      userId: "user-id",
      isExpired: () => false,
    };
    const user = User.create({
      email: Email.create("test@example.com"),
      passwordHash: "oldHash",
    });

    mockResetCodeRepository.findByCode.mockResolvedValue(resetCodeMock);
    mockUserRepository.findById.mockResolvedValue(user);
    mockPasswordHasher.hash.mockResolvedValue("newHash");
    mockUserRepository.save.mockResolvedValue(user);
    mockResetCodeRepository.delete.mockResolvedValue(undefined);

    await confirmPasswordReset.execute(code, newPassword);

    expect(mockResetCodeRepository.findByCode).toHaveBeenCalledWith(code);
    expect(mockUserRepository.findById).toHaveBeenCalledWith("user-id");
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith(newPassword);
    expect(mockUserRepository.save).toHaveBeenCalled();
    expect(mockResetCodeRepository.delete).toHaveBeenCalledWith(code);
  });

  it("should throw error if code invalid", async () => {
    mockResetCodeRepository.findByCode.mockResolvedValue(null);

    await expect(confirmPasswordReset.execute("bad_code", "pass")).rejects.toThrow(AppError);
    await expect(confirmPasswordReset.execute("bad_code", "pass")).rejects.toThrow("Invalid or expired reset code");
  });

  it("should throw error if code expired", async () => {
    const resetCodeMock = {
      userId: "user-id",
      isExpired: () => true,
    };
    mockResetCodeRepository.findByCode.mockResolvedValue(resetCodeMock);

    await expect(confirmPasswordReset.execute("expired_code", "pass")).rejects.toThrow(AppError);
    expect(mockResetCodeRepository.delete).toHaveBeenCalledWith("expired_code");
  });

  it("should throw error if user not found", async () => {
    const resetCodeMock = {
      userId: "user-id",
      isExpired: () => false,
    };
    mockResetCodeRepository.findByCode.mockResolvedValue(resetCodeMock);
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(confirmPasswordReset.execute("code", "pass")).rejects.toThrow(AppError);
    await expect(confirmPasswordReset.execute("code", "pass")).rejects.toThrow("User not found");
  });
});

