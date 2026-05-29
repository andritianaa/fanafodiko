import { ISessionRepository } from "../../domain/repositories/ISessionRepository";

export class Logout {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async execute(sessionId: string): Promise<void> {
    await this.sessionRepository.delete(sessionId);
  }
}
