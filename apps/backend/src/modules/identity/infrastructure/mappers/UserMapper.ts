import { User } from "../../domain/entities/User";
import { Email } from "../../domain/value-objects/Email";

interface IUserPersistence {
  _id?: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export class UserMapper {
  static toDomain(raw: IUserPersistence): User {
    return User.reconstitute({
      id: raw._id?.toString(),
      email: Email.create(raw.email),
      passwordHash: raw.passwordHash,
      createdAt: raw.createdAt,
    });
  }

  static toPersistence(user: User): IUserPersistence {
    return {
      _id: user.id,
      email: user.email.getValue(),
      passwordHash: user.passwordHash,
      createdAt: user.props.createdAt || new Date(),
    };
  }
}
