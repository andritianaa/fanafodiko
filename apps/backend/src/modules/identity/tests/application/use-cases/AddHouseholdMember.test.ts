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
      firstName: "Child",
      lastName: "Doe",
      dateOfBirth: new Date(),
      relationship: "child",
    };

    mockProfileRepository.save.mockResolvedValue(undefined);

    const result = await addHouseholdMember.execute(data);

    expect(result).toBeInstanceOf(Profile);
    expect(result.firstName).toBe(data.firstName);
    expect(mockProfileRepository.save).toHaveBeenCalled();
  });
});

