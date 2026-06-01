import { Email } from "../value-objects/Email";
import { UserRole } from "../value-objects/UserRole";

export interface UserProps {
  id?: string;
  email: Email;
  passwordHash: string;
  role?: UserRole;
  createdAt?: Date;
}

export class User {
  private constructor(public readonly props: UserProps) {}

  static create(props: UserProps): User {
    return new User({
      ...props,
      role: props.role ?? "user",
      createdAt: props.createdAt ?? new Date(),
    });
  }

  get id() {
    return this.props.id;
  }

  get email() {
    return this.props.email;
  }

  get passwordHash() {
    return this.props.passwordHash;
  }

  get role(): UserRole {
    return this.props.role ?? "user";
  }

  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  updatePassword(passwordHash: string): User {
    return new User({ ...this.props, passwordHash });
  }

  updateEmail(email: Email): User {
    return new User({ ...this.props, email });
  }
}
