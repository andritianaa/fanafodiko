import { describe, it, expect, mock, beforeEach } from "bun:test";
import { GetCurrentUser } from "../../../application/use-cases/GetCurrentUser";
import { User } from "../../../domain/entities/User";
import { Email } from "../../../domain/value-objects/Email";

describe("GetCurrentUser", () => {
  let getCurrentUser: GetCurrentUser;
  let mockUserRepository: any;

  beforeEach(() => {
    mockUserRepository = {
      findById: mock(),
    };

    getCurrentUser = new GetCurrentUser(mockUserRepository);
  });

  it("should return user dto if found", async () => {
    const user = User.reconstitute({
      id: "user-id",
      email: Email.create("test@example.com"),
      passwordHash: "hash",
    });

    mockUserRepository.findById.mockResolvedValue(user);

    const result = await getCurrentUser.execute("user-id");

    expect(result).not.toBeNull();
    expect(result?.email).toBe("test@example.com");
    expect(result?.id).toBe("user-id");
  });

  it("should return null if user not found", async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    const result = await getCurrentUser.execute("unknown-id");

    expect(result).toBeNull();
  });
});

