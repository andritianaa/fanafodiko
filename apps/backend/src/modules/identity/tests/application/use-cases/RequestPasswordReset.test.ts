import { describe, it, expect, mock, beforeEach } from "bun:test";
import { RequestPasswordReset } from "../../../application/use-cases/RequestPasswordReset";
import { User } from "../../../domain/entities/User";
import { Email } from "../../../domain/value-objects/Email";

describe("RequestPasswordReset", () => {
  let requestPasswordReset: RequestPasswordReset;
  let mockUserRepository: any;
  let mockResetCodeRepository: any;
  let mockEventBus: any;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: mock(),
    };
    mockResetCodeRepository = {
      deleteByUserId: mock(),
      save: mock(),
    };
    mockEventBus = {
      publish: mock(),
    };

    requestPasswordReset = new RequestPasswordReset(
      mockUserRepository,
      mockResetCodeRepository,
      mockEventBus
    );
  });

  it("should generate reset code and publish event if user exists", async () => {
    const email = "test@example.com";
    const user = User.reconstitute({
      id: "user-id",
      email: Email.create(email),
      passwordHash: "hash",
    });

    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockResetCodeRepository.deleteByUserId.mockResolvedValue(undefined);
    mockResetCodeRepository.save.mockResolvedValue(undefined);
    
    await requestPasswordReset.execute(email);

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
    expect(mockResetCodeRepository.deleteByUserId).toHaveBeenCalledWith("user-id");
    expect(mockResetCodeRepository.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalledWith("ResetCodeSeted", expect.any(Object));
  });

  it("should do nothing if user does not exist", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await requestPasswordReset.execute("unknown@example.com");

    expect(mockUserRepository.findByEmail).toHaveBeenCalled();
    expect(mockResetCodeRepository.deleteByUserId).not.toHaveBeenCalled();
    expect(mockResetCodeRepository.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});

