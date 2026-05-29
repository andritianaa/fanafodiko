import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Logout } from "../../../application/use-cases/Logout";

describe("Logout", () => {
  let logout: Logout;
  let mockSessionRepository: any;

  beforeEach(() => {
    mockSessionRepository = {
      delete: mock(),
    };

    logout = new Logout(mockSessionRepository);
  });

  it("should delete session", async () => {
    mockSessionRepository.delete.mockResolvedValue(undefined);

    await logout.execute("session-id");

    expect(mockSessionRepository.delete).toHaveBeenCalledWith("session-id");
  });
});

