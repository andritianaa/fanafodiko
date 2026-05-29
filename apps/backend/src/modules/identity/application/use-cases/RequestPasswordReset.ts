import { EventBus } from "@/core/events/EventBus";
import { PasswordResetCode } from "../../domain/entities/PasswordResetCode";
import { IResetCodeRepository } from "../../domain/repositories/IResetPasswordRepository";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ResetCodeSetedEvent } from "@/modules/identity/domain/events/ResetCodeSeted.event";

export class RequestPasswordReset {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly resetCodeRepository: IResetCodeRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return;
    }

    await this.resetCodeRepository.deleteByUserId(user.id!);

    const resetCode = PasswordResetCode.create({
      userId: user.id!,
    });

    await this.resetCodeRepository.save(resetCode);

    await this.eventBus.publish(
          "ResetCodeSeted",
          new ResetCodeSetedEvent(resetCode.code!, user.email.getValue()),
        );

  }
}
