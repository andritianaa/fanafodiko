import { EventBus } from "@/core/events/EventBus";
import { IMailer } from "@/core/services/mailing/IMailer";
import { ResetCodeSetedEvent } from "../../domain/events/ResetCodeSeted.event";

export const setupSendResetCodeEmailHandler = (
  eventBus: EventBus,
  mailer: IMailer,
) => {
  eventBus.subscribe("ResetCodeSeted", async (event: ResetCodeSetedEvent) => {
    try {
      await mailer.sendEmail(
        event.email,
        "Reset you password",
        `Click here to reset your password: ${event.code}`,
      );
      console.log(`📧 Reset email sent to ${event.email}`);
    } catch (error) {
      console.error("❌ Failed to send reset email", error);
    }
  });
};
