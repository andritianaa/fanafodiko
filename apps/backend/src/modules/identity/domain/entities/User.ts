import { Email } from "../value-objects/Email";

export interface UserProps {
  id?: string;
  email: Email;
  passwordHash: string;
  createdAt?: Date;
}

export class User {
  private constructor(public readonly props: UserProps) {}

  static create(props: UserProps): User {
    return new User({
      ...props,
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
