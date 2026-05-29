import { IMailer } from "@/core/services/mailing/IMailer";
import { welcomeEmailTemplate } from "@/core/services/mailing/emailTemplates";
import { UserRegisteredEvent } from "../../domain/events/UserRegistered.event";
import { EventBus } from "@/core/events/EventBus";

export const setupWelcomeEmailHandler = (
  eventBus: EventBus,
  mailer: IMailer,
) => {
  eventBus.subscribe("UserRegistered", async (event: UserRegisteredEvent) => {
    try {
      const { subject, html } = welcomeEmailTemplate(event.email);
      await mailer.sendEmail(event.email, subject, html);
      console.log(`📧 Email de bienvenue envoyé à ${event.email}`);
    } catch (error) {
      console.error("❌ Échec de l'envoi de l'email de bienvenue", error);
    }
  });
};
