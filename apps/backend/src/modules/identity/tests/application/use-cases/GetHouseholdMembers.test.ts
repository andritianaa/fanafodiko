import { describe, it, expect, mock, beforeEach } from "bun:test";
import { GetHouseholdMembers } from "../../../application/use-cases/GetHouseholdMembers";
import { Profile } from "../../../domain/entities/Profile";
import { Relationship } from "../../../domain/value-objects/Relationship";

describe("GetHouseholdMembers", () => {
  let getHouseholdMembers: GetHouseholdMembers;
  let mockProfileRepository: any;

  beforeEach(() => {
    mockProfileRepository = {
      findAllByAccountId: mock(),
    };

    getHouseholdMembers = new GetHouseholdMembers(mockProfileRepository);
  });

  it("should return list of profiles", async () => {
    const profiles = [
      Profile.reconstitute({
        id: "p1",
        accountId: "acc-1",
        fullName: "John Doe",
        relationship: Relationship.create("self"),
      }),
      Profile.reconstitute({
        id: "p2",
        accountId: "acc-1",
        fullName: "Jane Doe",
        relationship: Relationship.create("spouse"),
      }),
    ];
    mockProfileRepository.findAllByAccountId.mockResolvedValue(profiles);

    const result = await getHouseholdMembers.execute("account-id");

    expect(result).toBe(profiles);
    
    expect(mockProfileRepository.findAllByAccountId).toHaveBeenCalledWith("account-id");
  });
});

