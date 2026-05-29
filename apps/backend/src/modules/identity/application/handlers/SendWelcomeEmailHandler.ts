import { IMailer } from "@/core/services/mailing/IMailer";
import { UserRegisteredEvent } from "../../domain/events/UserRegistered.event";
import { EventBus } from "@/core/events/EventBus";

export const setupWelcomeEmailHandler = (
  eventBus: EventBus,
  mailer: IMailer,
) => {
  eventBus.subscribe("UserRegistered", async (event: UserRegisteredEvent) => {
    try {
      await mailer.sendEmail(
        event.email,
        "Welcome to our platform!",
        `<h1>Welcome!</h1><p>Thanks for joining us.</p>`,
      );
      console.log(`📧 Welcome email sent to ${event.email}`);
    } catch (error) {
      console.error("❌ Failed to send welcome email", error);
    }
  });
};
