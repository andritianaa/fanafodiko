import { describe, it, expect, mock, beforeEach } from "bun:test";
import { MongoProfileRepository } from "../../../infrastructure/repositories/ProfileRepository";
import { Profile } from "../../../domain/entities/Profile";
import { Relationship } from "../../../domain/value-objects/Relationship";

// Mock dependencies
const mockProfileModel = {
  findOne: mock(),
  findById: mock(),
  find: mock(),
  updateOne: mock(),
  create: mock(),
  deleteOne: mock(),
};

mock.module("../../../infrastructure/models/ProfileModel", () => ({
  ProfileModel: mockProfileModel,
}));

describe("MongoProfileRepository", () => {
  let repository: MongoProfileRepository;

  beforeEach(() => {
    repository = new MongoProfileRepository();
    mockProfileModel.findOne.mockReset();
    mockProfileModel.findById.mockReset();
    mockProfileModel.find.mockReset();
    mockProfileModel.updateOne.mockReset();
    mockProfileModel.create.mockReset();
    mockProfileModel.deleteOne.mockReset();
  });

  it("should save existing profile (update)", async () => {
    const profile = Profile.reconstitute({
      id: "profile-id",
      accountId: "acc-id",
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: new Date(),
      relationship: Relationship.create("self"),
    });

    mockProfileModel.updateOne.mockResolvedValue({});

    await repository.save(profile);

    expect(mockProfileModel.updateOne).toHaveBeenCalled();
    expect(mockProfileModel.create).not.toHaveBeenCalled();
  });

  it("should save new profile (create)", async () => {
    const profile = Profile.reconstitute({
      accountId: "acc-id",
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: new Date(),
      relationship: Relationship.create("self"),
    });

    mockProfileModel.create.mockResolvedValue({});

    await repository.save(profile);

    expect(mockProfileModel.create).toHaveBeenCalled();
  });

  it("should find profile by id", async () => {
    const doc = {
      _id: "profile-id",
      accountId: "acc-id",
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: new Date(),
      relationship: "self",
    };
    mockProfileModel.findById.mockReturnValue({
      lean: mock().mockResolvedValue(doc),
    });

    const result = await repository.findById("profile-id");

    expect(result).not.toBeNull();
    expect(result?.id).toBe("profile-id");
  });

  it("should find all profiles by account id", async () => {
    const docs = [
      {
        _id: "p1",
        accountId: "acc-id",
        firstName: "P1",
        lastName: "D",
        dateOfBirth: new Date(),
        relationship: "self",
      },
    ];
    mockProfileModel.find.mockReturnValue({
      lean: mock().mockResolvedValue(docs),
    });

    const result = await repository.findAllByAccountId("acc-id");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p1");
  });

  it("should delete profile", async () => {
    mockProfileModel.deleteOne.mockResolvedValue({});

    await repository.delete("p1");

    expect(mockProfileModel.deleteOne).toHaveBeenCalledWith({ _id: "p1" });
  });
});

