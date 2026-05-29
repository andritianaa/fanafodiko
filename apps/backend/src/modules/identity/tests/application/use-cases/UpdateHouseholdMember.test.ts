import { describe, it, expect, mock, beforeEach } from "bun:test";
import { UpdateHouseholdMember } from "../../../application/use-cases/UpdateHouseholdMember";
import { AppError } from "@/core/errors/AppError";

describe("UpdateHouseholdMember", () => {
  let updateHouseholdMember: UpdateHouseholdMember;
  let mockProfileRepository: any;

  beforeEach(() => {
    mockProfileRepository = {
      findById: mock(),
      save: mock(),
    };

    updateHouseholdMember = new UpdateHouseholdMember(mockProfileRepository);
  });

  it("should update profile if authorized", async () => {
    const profileMock = {
      accountId: "acc-id",
      updateProfile: mock().mockImplementation((updates) => ({ ...profileMock, ...updates })),
    };
    mockProfileRepository.findById.mockResolvedValue(profileMock);
    mockProfileRepository.save.mockResolvedValue(undefined);

    const updates = { firstName: "NewName" };
    const result = await updateHouseholdMember.execute("acc-id", "pid", updates);

    expect(result.firstName).toBe("NewName");
    expect(mockProfileRepository.findById).toHaveBeenCalledWith("pid");
    expect(mockProfileRepository.save).toHaveBeenCalled();
  });

  it("should throw error if unauthorized", async () => {
    const profileMock = {
      accountId: "other-acc",
    };
    mockProfileRepository.findById.mockResolvedValue(profileMock);

    await expect(updateHouseholdMember.execute("my-acc", "pid", {})).rejects.toThrow(AppError);
    await expect(updateHouseholdMember.execute("my-acc", "pid", {})).rejects.toThrow("Unauthorized");
  });
});

