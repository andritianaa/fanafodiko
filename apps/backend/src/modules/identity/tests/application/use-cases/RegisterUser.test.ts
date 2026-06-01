import { describe, it, expect, mock, beforeEach } from "bun:test";
import { RegisterUser } from "../../../application/use-cases/RegisterUser";
import { User } from "../../../domain/entities/User";
import { Email } from "../../../domain/value-objects/Email";
import { AppError } from "@/core/errors/AppError";

describe("RegisterUser", () => {
  let registerUser: RegisterUser;
  let mockUserRepository: any;
  let mockPasswordHasher: any;
  let mockEventBus: any;
  let mockProfileRepository: any;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: mock(),
      save: mock(),
    };
    mockPasswordHasher = {
      hash: mock(),
    };
    mockEventBus = {
      publish: mock(),
    };
    mockProfileRepository = {
      save: mock(),
    };

    registerUser = new RegisterUser(
      mockUserRepository,
      mockPasswordHasher,
      mockEventBus,
      mockProfileRepository
    );
  });

  it("should register a new user successfully", async () => {
    const data = {
      email: "test@example.com",
      password: "password123",
      fullName: "John Doe",
    };

    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockPasswordHasher.hash.mockResolvedValue("hashed_password");
    mockUserRepository.save.mockImplementation((user: User) => {
      // Return a user with an id
      return Promise.resolve(User.reconstitute({
        ...user.props,
        id: "user-id"
      }));
    });
    mockProfileRepository.save.mockResolvedValue(undefined);

    const result = await registerUser.execute(data);

    expect(result).toBeInstanceOf(User);
    expect(result.email.getValue()).toBe(data.email);
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(data.email);
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith(data.password);
    expect(mockUserRepository.save).toHaveBeenCalled();
    expect(mockProfileRepository.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalledWith("UserRegistered", expect.any(Object));
  });

  it("should throw error if email already exists", async () => {
    const data = {
      email: "existing@example.com",
      password: "password123",
      fullName: "Jane Doe",
    };

    mockUserRepository.findByEmail.mockResolvedValue(
      User.create({
        email: Email.create(data.email),
        passwordHash: "existing_hash",
      })
    );

    await expect(registerUser.execute(data)).rejects.toThrow(AppError);
    await expect(registerUser.execute(data)).rejects.toThrow("User with this email already exists");
  });
});

