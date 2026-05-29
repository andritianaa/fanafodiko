import { randomBytes } from 'node:crypto';

export interface ResetCodeProps {
  id?: string;
  code?: string;
  userId: string;
  expiresAt?: Date;
}

export class PasswordResetCode {
  constructor(public readonly props: ResetCodeProps) {}

  static create(props: ResetCodeProps): PasswordResetCode {
    const expiresAt = new Date();

    const code = randomBytes(3).toString('hex').toUpperCase();

    expiresAt.setHours(expiresAt.getHours() + 24); // valide 24h
    return new PasswordResetCode({
      ...props,
      expiresAt,
      code,
    });
  }

  static reconstitute(props: ResetCodeProps): PasswordResetCode {
    return new PasswordResetCode(props);
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get code(): string | undefined {
    return this.props.code;
  }

  get userId(): string {
    return this.props.userId;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt!;
  }
}
