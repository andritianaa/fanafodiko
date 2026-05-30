import { AppError } from "@/core/errors/AppError";
import { Frequency, FrequencyProps } from "../value-objects/Frequency";

export interface MedicationProps {
  id?: string;
  profileId: string;
  name: string;
  dosage: string;
  frequency: Frequency;
  startDate: Date;
  endDate?: Date | null;
  isActive: boolean;
  utcOffsetMinutes: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Medication {
  private constructor(public readonly props: MedicationProps) {}

  static create(props: {
    profileId: string;
    name: string;
    dosage: string;
    frequency: FrequencyProps;
    startDate: Date;
    endDate?: Date | null;
    utcOffsetMinutes?: number;
  }): Medication {
    // Basic Validation
    if (!props.profileId) throw new AppError("Profile ID is required", 400, "INVALID_PROFILE_ID");
    if (!props.name || props.name.trim().length === 0) throw new AppError("Name is required", 400, "INVALID_NAME");
    if (!props.dosage || props.dosage.trim().length === 0) throw new AppError("Dosage is required", 400, "INVALID_DOSAGE");
    
    const frequency = Frequency.create(props.frequency);

    return new Medication({
      profileId: props.profileId,
      name: props.name,
      dosage: props.dosage,
      frequency: frequency,
      startDate: props.startDate,
      endDate: props.endDate ?? null,
      isActive: true,
      utcOffsetMinutes: props.utcOffsetMinutes ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: MedicationProps): Medication {
    return new Medication(props);
  }

  // Getters
  get id(): string | undefined { return this.props.id; }
  get profileId(): string { return this.props.profileId; }
  get name(): string { return this.props.name; }
  get dosage(): string { return this.props.dosage; }
  get frequency(): Frequency { return this.props.frequency; }
  get startDate(): Date { return this.props.startDate; }
  get endDate(): Date | null | undefined { return this.props.endDate; }
  get isActive(): boolean { return this.props.isActive; }
  get utcOffsetMinutes(): number { return this.props.utcOffsetMinutes; }
  get createdAt(): Date | undefined { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  // Business Logic
  
  pause(): void {
    if (!this.props.isActive) {
      throw new AppError("Medication is already paused", 400, "MEDICATION_ALREADY_PAUSED");
    }
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  resume(): void {
    if (this.props.isActive) {
      throw new AppError("Medication is already active", 400, "MEDICATION_ALREADY_ACTIVE");
    }
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  update(updates: {
    name?: string;
    dosage?: string;
    frequency?: FrequencyProps;
    startDate?: Date;
    endDate?: Date | null;
    utcOffsetMinutes?: number;
  }): void {
    if (updates.name !== undefined) {
        if (!updates.name || updates.name.trim().length === 0) throw new AppError("Name cannot be empty", 400, "INVALID_NAME");
        this.props.name = updates.name;
    }
    if (updates.dosage !== undefined) {
        if (!updates.dosage || updates.dosage.trim().length === 0) throw new AppError("Dosage cannot be empty", 400, "INVALID_DOSAGE");
        this.props.dosage = updates.dosage;
    }
    if (updates.frequency !== undefined) {
        this.props.frequency = Frequency.create(updates.frequency);
    }
    if (updates.startDate !== undefined) {
        this.props.startDate = updates.startDate;
    }
    if (updates.endDate !== undefined) {
        this.props.endDate = updates.endDate;
    }
    if (updates.utcOffsetMinutes !== undefined) {
        this.props.utcOffsetMinutes = updates.utcOffsetMinutes;
    }

    this.props.updatedAt = new Date();
  }
}
