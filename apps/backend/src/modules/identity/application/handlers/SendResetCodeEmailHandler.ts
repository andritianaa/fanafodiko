import { EventBus } from "@/core/events/EventBus";
import { IMailer } from "@/core/services/mailing/IMailer";
import { resetPasswordEmailTemplate } from "@/core/services/mailing/emailTemplates";
import { ResetCodeSetedEvent } from "../../domain/events/ResetCodeSeted.event";

export const setupSendResetCodeEmailHandler = (
  eventBus: EventBus,
  mailer: IMailer,
) => {
  eventBus.subscribe("ResetCodeSeted", async (event: ResetCodeSetedEvent) => {
    try {
      const { subject, html } = resetPasswordEmailTemplate(event.code);
      await mailer.sendEmail(event.email, subject, html);
      console.log(`📧 Email de réinitialisation envoyé à ${event.email}`);
    } catch (error) {
      console.error("❌ Échec de l'envoi de l'email de réinitialisation", error);
    }
  });
};
