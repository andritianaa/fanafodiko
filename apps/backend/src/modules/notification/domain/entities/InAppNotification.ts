import { AppError } from "@/core/errors/AppError";

export interface InAppNotificationProps {
  id?: string;
  profileId: string;
  taskId?: string;
  medicationName: string;
  dosage: string;
  scheduledAt: Date;
  message: string;
  read: boolean;
  createdAt?: Date;
  readAt?: Date;
}

export class InAppNotification {
  private constructor(public readonly props: InAppNotificationProps) {}

  static create(props: {
    profileId: string;
    taskId?: string;
    medicationName: string;
    dosage: string;
    scheduledAt: Date;
    message: string;
  }): InAppNotification {
    if (!props.profileId) {
      throw new AppError("Profile ID is required", 400, "INVALID_PROFILE_ID");
    }
    if (!props.medicationName) {
      throw new AppError("Medication name is required", 400, "INVALID_MEDICATION_NAME");
    }
    if (!props.message) {
      throw new AppError("Message is required", 400, "INVALID_MESSAGE");
    }

    return new InAppNotification({
      profileId: props.profileId,
      taskId: props.taskId,
      medicationName: props.medicationName,
      dosage: props.dosage,
      scheduledAt: props.scheduledAt,
      message: props.message,
      read: false,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: InAppNotificationProps): InAppNotification {
    return new InAppNotification(props);
  }

  get id(): string | undefined {
    return this.props.id;
  }
  get profileId(): string {
    return this.props.profileId;
  }
  get taskId(): string | undefined {
    return this.props.taskId;
  }
  get medicationName(): string {
    return this.props.medicationName;
  }
  get dosage(): string {
    return this.props.dosage;
  }
  get scheduledAt(): Date {
    return this.props.scheduledAt;
  }
  get message(): string {
    return this.props.message;
  }
  get read(): boolean {
    return this.props.read;
  }
  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }
  get readAt(): Date | undefined {
    return this.props.readAt;
  }

  markAsRead(): void {
    if (this.props.read) return;
    this.props.read = true;
    this.props.readAt = new Date();
  }

  markAsUnread(): void {
    if (!this.props.read) return;
    this.props.read = false;
    this.props.readAt = undefined;
  }
}
