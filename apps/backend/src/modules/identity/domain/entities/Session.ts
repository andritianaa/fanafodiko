export interface SessionProps {
  id: string; // le token de session
  userId: string;
  expiresAt: Date;
}

export class Session {
  constructor(private readonly props: SessionProps) {}

  static save(userId: string, token: string): Session {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Session de 30 jours

    return new Session({
      id: token,
      userId,
      expiresAt,
    });
  }

  public static reconstitute(props: SessionProps): Session {
    return new Session(props);
  }

  public isExpired(): boolean {
    return this.props.expiresAt < new Date();
  }

  get id() {
    return this.props.id;
  }

  get userId() {
    return this.props.userId;
  }

  get expiresAt() {
    return this.props.expiresAt;
  }
}
