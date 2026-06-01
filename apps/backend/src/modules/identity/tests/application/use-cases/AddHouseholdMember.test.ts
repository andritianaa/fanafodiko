import { describe, it, expect, mock, beforeEach } from "bun:test";
import { AddHouseholdMember } from "../../../application/use-cases/AddHouseholdMember";
import { Profile } from "../../../domain/entities/Profile";

describe("AddHouseholdMember", () => {
  let addHouseholdMember: AddHouseholdMember;
  let mockProfileRepository: any;

  beforeEach(() => {
    mockProfileRepository = {
      save: mock(),
    };

    addHouseholdMember = new AddHouseholdMember(mockProfileRepository);
  });

  it("should create and save a new profile", async () => {
    const data = {
      accountId: "account-id",
      fullName: "Child Doe",
      relationship: "child",
    };

    mockProfileRepository.save.mockResolvedValue(undefined);

    const result = await addHouseholdMember.execute(data);

    expect(result).toBeInstanceOf(Profile);
    expect(result.fullName).toBe(data.fullName);
    expect(mockProfileRepository.save).toHaveBeenCalled();
  });
});

