import { AppError } from "@/core/errors/AppError";
import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { Email } from "../../domain/value-objects/Email";
import { IPasswordHasher } from "../ports/IPasswordHasher";
import { EventBus } from "@/core/events/EventBus";
import { UserRegisteredEvent } from "../../domain/events/UserRegistered.event";
import { Relationship } from "../../domain/value-objects/Relationship";
import { Profile } from "../../domain/entities/Profile";
import { IProfileRepository } from "../../domain/repositories/IProfileRepository";

interface RegisterUserDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
}

export class RegisterUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly eventBus: EventBus,
    private readonly profileRepository: IProfileRepository,
  ) {}

  async execute(data: RegisterUserDTO): Promise<User> {
    const emailVO = Email.create(data.email);

    const existingUser = await this.userRepository.findByEmail(
      emailVO.getValue(),
    );
    if (existingUser) {
      throw new AppError(
        "User with this email already exists",
        409,
        "USER_ALREADY_EXISTS",
      );
    }
    const passwordHash = await this.passwordHasher.hash(data.password);
    const user = User.create({
      email: emailVO,
      passwordHash: passwordHash,
    });

    const savedUser = await this.userRepository.save(user);

    const profile = Profile.create({
      accountId: savedUser.id!,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth ?? new Date("2000-01-01"), 
      relationship: Relationship.create("self"),
    });

    await this.profileRepository.save(profile);

    await this.eventBus.publish(
      "UserRegistered",
      new UserRegisteredEvent(savedUser.id!, savedUser.email.getValue()),
    );
    return savedUser;
  }
}
