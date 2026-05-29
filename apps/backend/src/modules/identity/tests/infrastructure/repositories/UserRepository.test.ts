import { describe, it, expect, mock, beforeEach } from "bun:test";
import { MongoUserRepository } from "../../../infrastructure/repositories/UserRepository";
import { User } from "../../../domain/entities/User";
import { Email } from "../../../domain/value-objects/Email";

// Mock dependencies
const mockUserModel = {
  findOne: mock(),
  findById: mock(),
  updateOne: mock(),
};

mock.module("../../../infrastructure/models/UserModel", () => ({
  UserModel: mockUserModel,
}));

describe("MongoUserRepository", () => {
  let repository: MongoUserRepository;

  beforeEach(() => {
    repository = new MongoUserRepository();
    mockUserModel.findOne.mockReset();
    mockUserModel.findById.mockReset();
    mockUserModel.updateOne.mockReset();
  });

  it("should find user by email", async () => {
    const userDoc = {
      _id: "user-id",
      email: "test@example.com",
      passwordHash: "hash",
    };
    mockUserModel.findOne.mockReturnValue({
      lean: mock().mockResolvedValue(userDoc),
    });

    const result = await repository.findByEmail("test@example.com");

    expect(result).not.toBeNull();
    expect(result?.id).toBe("user-id");
    expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
  });

  it("should save user", async () => {
    const user = User.reconstitute({
      id: "user-id",
      email: Email.create("test@example.com"),
      passwordHash: "hash",
    });

    // Mock updateOne
    mockUserModel.updateOne.mockResolvedValue({});

    await repository.save(user);

    expect(mockUserModel.updateOne).toHaveBeenCalled();
  });

  it("should find user by id", async () => {
     const userDoc = {
      _id: "user-id",
      email: "test@example.com",
      passwordHash: "hash",
    };
    mockUserModel.findById.mockReturnValue({
      lean: mock().mockResolvedValue(userDoc),
    });

    const result = await repository.findById("user-id");

    expect(result).not.toBeNull();
    expect(result?.id).toBe("user-id");
    expect(mockUserModel.findById).toHaveBeenCalledWith("user-id");
  });
});

