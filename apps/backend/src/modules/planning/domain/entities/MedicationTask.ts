import { AppError } from "@/core/errors/AppError";

export enum TaskStatus {
  PENDING = "PENDING",
  TAKEN = "TAKEN",
  MISSED = "MISSED",
  SKIPPED = "SKIPPED",
}

export interface MedicationTaskProps {
  id?: string;
  medicationId: string;
  profileId: string;
  scheduledAt: Date;
  status: TaskStatus;
  takenAt?: Date;
  uniqueHash?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class MedicationTask {
  private constructor(public readonly props: MedicationTaskProps) {}

  static create(props: {
    medicationId: string;
    profileId: string;
    scheduledAt: Date;
    status?: TaskStatus;
  }): MedicationTask {
    if (!props.medicationId) throw new AppError("Medication ID is required", 400, "INVALID_MEDICATION_ID");
    if (!props.profileId) throw new AppError("Profile ID is required", 400, "INVALID_PROFILE_ID");
    if (!props.scheduledAt) throw new AppError("Scheduled date is required", 400, "INVALID_SCHEDULED_AT");

    return new MedicationTask({
      medicationId: props.medicationId,
      profileId: props.profileId,
      scheduledAt: props.scheduledAt,
      status: props.status || TaskStatus.PENDING,
      uniqueHash: MedicationTask.generateHash(props.medicationId, props.scheduledAt),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: MedicationTaskProps): MedicationTask {
    return new MedicationTask(props);
  }

  static generateHash(medicationId: string, scheduledAt: Date): string {
    return `${medicationId}_${scheduledAt.getTime()}`;
  }

  // Getters
  get id(): string | undefined { return this.props.id; }
  get medicationId(): string { return this.props.medicationId; }
  get profileId(): string { return this.props.profileId; }
  get scheduledAt(): Date { return this.props.scheduledAt; }
  get status(): TaskStatus { return this.props.status; }
  get uniqueHash(): string | undefined { return this.props.uniqueHash; }
  get takenAt(): Date | undefined { return this.props.takenAt; }
  get createdAt(): Date | undefined { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  // Business Logic
  markAsTaken(at: Date = new Date()): void {
    if (this.props.status === TaskStatus.TAKEN) return;
    this.props.status = TaskStatus.TAKEN;
    this.props.takenAt = at;
    this.props.updatedAt = new Date();
  }

  markAsMissed(): void {
    if (this.props.status !== TaskStatus.PENDING) return;
    this.props.status = TaskStatus.MISSED;
    this.props.updatedAt = new Date();
  }

  markAsSkipped(): void {
    if (this.props.status !== TaskStatus.PENDING) return;
    this.props.status = TaskStatus.SKIPPED;
    this.props.updatedAt = new Date();
  }
}
