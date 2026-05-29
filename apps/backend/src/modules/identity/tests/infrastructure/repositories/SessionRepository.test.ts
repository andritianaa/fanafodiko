import { describe, it, expect, mock, beforeEach } from "bun:test";
import { MongoSessionRepository } from "../../../infrastructure/repositories/SessionRepository";
import { Session } from "../../../domain/entities/Session";

// Mock dependencies
const mockSessionModel = {
  findById: mock(),
  updateOne: mock(),
  deleteOne: mock(),
};

mock.module("../../../infrastructure/models/SessionModel", () => ({
  SessionModel: mockSessionModel,
}));

describe("MongoSessionRepository", () => {
  let repository: MongoSessionRepository;

  beforeEach(() => {
    repository = new MongoSessionRepository();
    mockSessionModel.findById.mockReset();
    mockSessionModel.updateOne.mockReset();
    mockSessionModel.deleteOne.mockReset();
  });

  it("should save session", async () => {
    const session = Session.reconstitute({
      id: "session-id",
      userId: "user-id",
      expiresAt: new Date(),
    });

    mockSessionModel.updateOne.mockResolvedValue({});

    await repository.save(session);

    expect(mockSessionModel.updateOne).toHaveBeenCalled();
  });

  it("should delete session", async () => {
    mockSessionModel.deleteOne.mockResolvedValue({});

    await repository.delete("session-id");

    expect(mockSessionModel.deleteOne).toHaveBeenCalledWith({ _id: "session-id" });
  });

  it("should find session by id", async () => {
    const doc = {
      _id: "session-id",
      userId: "user-id",
      expiresAt: new Date(),
    };
    mockSessionModel.findById.mockReturnValue({
      lean: mock().mockResolvedValue(doc),
    });

    const result = await repository.findById("session-id");

    expect(result).not.toBeNull();
    expect(result?.id).toBe("session-id");
  });
});

