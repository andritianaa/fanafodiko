import { Resend } from "resend";
import {
  INotificationService,
  NotificationParams,
} from "../../domain/services/INotificationService";

export class ResendNotificationService implements INotificationService {
  private readonly resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async send(params: NotificationParams): Promise<void> {
    if (params.emailEnabled === false) return;

    try {
      const emailBody = this.buildEmailHTML(params);

      if (!params.profileEmail) {
        console.warn(
          `No email address for profile ${params.profileId}. Skipping notification.`,
        );
        return;
      }

      await this.resend.emails.send({
        from: `Fanafodiko <reminder@${process.env.RESEND_DOMAIN_NAME}>`,
        to: params.profileEmail,
        subject: `Rappel: ${params.medicationName}`,
        html: emailBody,
      });
    } catch (error) {
      console.error(`[Failed to send email notification:`, error);
    }
  }

  private buildEmailHTML(params: NotificationParams): string {
    // Convert UTC scheduledAt back to the user's local time using the stored offset.
    // utcOffsetMinutes = getTimezoneOffset() = -(UTC offset in hours)*60
    // localMinutes = utcMinutes - utcOffsetMinutes
    const utcMins = params.scheduledAt.getUTCHours() * 60 + params.scheduledAt.getUTCMinutes();
    const localTotalMins = ((utcMins - params.utcOffsetMinutes) % 1440 + 1440) % 1440;
    const localH = Math.floor(localTotalMins / 60);
    const localM = localTotalMins % 60;
    const scheduledTime = `${String(localH).padStart(2, "0")}:${String(localM).padStart(2, "0")}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .medication-info { background-color: white; padding: 20px; border-left: 4px solid #4f46e5; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Rappel de Médicament</h1>
          </div>
          <div class="content">
            <p>Bonjour,</p>
            <p>C'est l'heure de prendre votre médicament :</p>
            
            <div class="medication-info">
              <h2>${params.medicationName}</h2>
              <p><strong>Dosage :</strong> ${params.dosage}</p>
              <p><strong>Heure prévue :</strong> ${scheduledTime}</p>
            </div>
            
            <p>N'oubliez pas de confirmer votre prise dans l'application Fanafodiko.</p>
            
            <div class="footer">
              <p>Fanafodiko - Suivi Médical Intelligent</p>
              <p>Cet email est envoyé automatiquement. Ne pas répondre.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
