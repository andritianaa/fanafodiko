export interface NotificationParams {
  profileId: string;
  medicationName: string;
  dosage: string;
  scheduledAt: Date;
  profileEmail?: string;
  /** Same value as new Date().getTimezoneOffset() in the user's browser (negative = UTC+) */
  utcOffsetMinutes: number;
  /** Respects the user's emailMedicationReminders preference. Defaults to true. */
  emailEnabled?: boolean;
}

export interface INotificationService {
  send(params: NotificationParams): Promise<void>;
}
