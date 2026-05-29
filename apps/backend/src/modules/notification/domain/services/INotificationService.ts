export interface NotificationParams {
  profileId: string;
  medicationName: string;
  dosage: string;
  scheduledAt: Date;
  profileEmail?: string;
}

export interface INotificationService {
  send(params: NotificationParams): Promise<void>;
}
