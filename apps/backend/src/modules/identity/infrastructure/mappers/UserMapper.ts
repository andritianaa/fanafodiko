import { User } from "../../domain/entities/User";
import { Email } from "../../domain/value-objects/Email";
import { UserRole } from "../../domain/value-objects/UserRole";

interface IUserPersistence {
  _id?: string;
  email: string;
  passwordHash: string;
  role?: string;
  createdAt: Date;
}

export class UserMapper {
  static toDomain(raw: IUserPersistence): User {
    return User.reconstitute({
      id: raw._id?.toString(),
      email: Email.create(raw.email),
      passwordHash: raw.passwordHash,
      role: (raw.role as UserRole) ?? "user",
      createdAt: raw.createdAt,
    });
  }

  static toPersistence(user: User): IUserPersistence {
    return {
      _id: user.id,
      email: user.email.getValue(),
      passwordHash: user.passwordHash,
      role: user.role,
      createdAt: user.props.createdAt || new Date(),
    };
  }
}
