import { describe, it, expect, mock, beforeEach } from "bun:test";
import { MongoResetPasswordRepository } from "../../../infrastructure/repositories/ResetPasswordRepository";
import { PasswordResetCode } from "../../../domain/entities/PasswordResetCode";

// Mock dependencies
const mockResetCodeModel = {
  findOne: mock(),
  findById: mock(),
  updateOne: mock(),
  deleteOne: mock(),
  deleteMany: mock(),
};

mock.module("../../../infrastructure/models/ResetCodeModel", () => ({
  ResetCodeModel: mockResetCodeModel,
}));

describe("MongoResetPasswordRepository", () => {
  let repository: MongoResetPasswordRepository;

  beforeEach(() => {
    repository = new MongoResetPasswordRepository();
    mockResetCodeModel.findOne.mockReset();
    mockResetCodeModel.findById.mockReset();
    mockResetCodeModel.updateOne.mockReset();
    mockResetCodeModel.deleteOne.mockReset();
    mockResetCodeModel.deleteMany.mockReset();
  });

  it("should save reset code", async () => {
    const resetCode = PasswordResetCode.create({ userId: "user-id" });
    
    mockResetCodeModel.updateOne.mockResolvedValue({});

    await repository.save(resetCode);

    expect(mockResetCodeModel.updateOne).toHaveBeenCalled();
  });

  it("should find by id", async () => {
    const doc = {
      _id: "id",
      code: "123456",
      userId: "user-id",
      expiresAt: new Date(),
    };
    mockResetCodeModel.findById.mockReturnValue({
      lean: mock().mockResolvedValue(doc),
    });

    const result = await repository.findById("id");

    expect(result).not.toBeNull();
    expect(result?.code).toBe("123456");
  });

  it("should find by code", async () => {
    const doc = {
      _id: "id",
      code: "123456",
      userId: "user-id",
      expiresAt: new Date(),
    };
    mockResetCodeModel.findOne.mockReturnValue({
      lean: mock().mockResolvedValue(doc),
    });

    const result = await repository.findByCode("123456");

    expect(result).not.toBeNull();
    expect(result?.code).toBe("123456");
  });

  it("should delete by code", async () => {
    mockResetCodeModel.deleteOne.mockResolvedValue({});

    await repository.delete("123456");

    expect(mockResetCodeModel.deleteOne).toHaveBeenCalledWith({ code: "123456" });
  });

  it("should delete by user id", async () => {
    mockResetCodeModel.deleteMany.mockResolvedValue({});

    await repository.deleteByUserId("user-id");

    expect(mockResetCodeModel.deleteMany).toHaveBeenCalledWith({ userId: "user-id" });
  });
});

