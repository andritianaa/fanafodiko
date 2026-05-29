export interface IMailer {
  sendEmail(to: string, subject: string, html: string): Promise<void>;
}
