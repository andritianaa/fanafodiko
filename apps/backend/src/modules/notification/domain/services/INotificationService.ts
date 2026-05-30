export interface NotificationParams {
  profileId: string;
  medicationName: string;
  dosage: string;
  scheduledAt: Date;
  profileEmail?: string;
  /** Same value as new Date().getTimezoneOffset() in the user's browser (negative = UTC+) */
  utcOffsetMinutes: number;
}

export interface INotificationService {
  send(params: NotificationParams): Promise<void>;
}
