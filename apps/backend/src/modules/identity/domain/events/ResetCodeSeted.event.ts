export class ResetCodeSetedEvent {
  public readonly occurredOn: Date;

  constructor(
    public readonly code: string,
    public readonly email: string,
  ) {
    this.occurredOn = new Date();
  }
}
