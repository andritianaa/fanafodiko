import { Resend } from "resend";
import { IMailer } from "./IMailer";
import { AppError } from "@/core/errors/AppError";

export class ResendMailer implements IMailer {
  private readonly resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: `Fanafodiko <contact@${process.env.RESEND_DOMAIN_NAME}>`,
      to,
      subject,
      html,
    });

    if (error) {
      throw new AppError(
        "Email service unavailable",
        503,
        "EMAIL_SERVICE_ERROR",
      );
    }
  }
}
