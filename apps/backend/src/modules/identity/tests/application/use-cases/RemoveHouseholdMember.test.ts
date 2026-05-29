import { describe, it, expect, mock, beforeEach } from "bun:test";
import { RemoveHouseholdMember } from "../../../application/use-cases/RemoveHouseholdMember";
import { AppError } from "@/core/errors/AppError";

describe("RemoveHouseholdMember", () => {
  let removeHouseholdMember: RemoveHouseholdMember;
  let mockProfileRepository: any;

  beforeEach(() => {
    mockProfileRepository = {
      findById: mock(),
      delete: mock(),
    };

    removeHouseholdMember = new RemoveHouseholdMember(mockProfileRepository);
  });

  it("should remove member if authorized and not self", async () => {
    const profileMock = {
      accountId: "acc-id",
      relationship: {
        isSelf: () => false,
      },
    };
    mockProfileRepository.findById.mockResolvedValue(profileMock);
    mockProfileRepository.delete.mockResolvedValue(undefined);

    await removeHouseholdMember.execute("acc-id", "pid");

    expect(mockProfileRepository.delete).toHaveBeenCalledWith("pid");
  });

  it("should throw error if trying to remove self (owner)", async () => {
    const profileMock = {
      accountId: "acc-id",
      relationship: {
        isSelf: () => true,
      },
    };
    mockProfileRepository.findById.mockResolvedValue(profileMock);

    await expect(removeHouseholdMember.execute("acc-id", "pid")).rejects.toThrow(AppError);
    await expect(removeHouseholdMember.execute("acc-id", "pid")).rejects.toThrow("Cannot delete the owner profile");
  });

  it("should throw error if unauthorized", async () => {
    const profileMock = {
      accountId: "other-acc",
    };
    mockProfileRepository.findById.mockResolvedValue(profileMock);

    await expect(removeHouseholdMember.execute("my-acc", "pid")).rejects.toThrow(AppError);
    await expect(removeHouseholdMember.execute("my-acc", "pid")).rejects.toThrow("Unauthorized");
  });
});

