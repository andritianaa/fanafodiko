import { AppError } from "@/core/errors/AppError";
import { Relationship } from "../value-objects/Relationship";

export interface ProfileProps {
  id?: string;
  accountId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  relationship: Relationship;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Profile {
  private constructor(public readonly props: ProfileProps) {}

  static create(props: ProfileProps): Profile {
    // Validation: firstName et lastName ne doivent pas être vides
    if (!props.firstName || props.firstName.trim().length === 0) {
      throw new AppError("First name cannot be empty", 400, "INVALID_FIRST_NAME");
    }

    if (!props.lastName || props.lastName.trim().length === 0) {
      throw new AppError("Last name cannot be empty", 400, "INVALID_LAST_NAME");
    }

    // Validation: dateOfBirth ne peut pas être dans le futur
    if (props.dateOfBirth.getTime() > Date.now()) {
      throw new AppError("Date of birth cannot be in the future", 400, "INVALID_DATE_OF_BIRTH");
    }

    // Validation: accountId ne doit pas être vide
    if (!props.accountId || props.accountId.trim().length === 0) {
      throw new AppError("Account ID is required", 400, "INVALID_ACCOUNT_ID");
    }

    const now = new Date();
    return new Profile({
      ...props,
      firstName: props.firstName.trim(),
      lastName: props.lastName.trim(),
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    });
  }

  static reconstitute(props: ProfileProps): Profile {
    return new Profile(props);
  }

  // Getters
  get id(): string | undefined {
    return this.props.id;
  }

  get accountId(): string {
    return this.props.accountId;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get dateOfBirth(): Date {
    return this.props.dateOfBirth;
  }

  get relationship(): Relationship {
    return this.props.relationship;
  }

  get avatarUrl(): string | undefined {
    return this.props.avatarUrl;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  // Business methods
  getAge(): number {
    const today = new Date();
    const birthDate = this.props.dateOfBirth;
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  isMinor(): boolean {
    return this.getAge() < 18;
  }

  updateProfile(updates: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    avatarUrl?: string;
  }): Profile {
    const updatedProps = { ...this.props };

    if (updates.firstName !== undefined) {
      if (!updates.firstName || updates.firstName.trim().length === 0) {
        throw new AppError("First name cannot be empty", 400, "INVALID_FIRST_NAME");
      }
      updatedProps.firstName = updates.firstName.trim();
    }

    if (updates.lastName !== undefined) {
      if (!updates.lastName || updates.lastName.trim().length === 0) {
        throw new AppError("Last name cannot be empty", 400, "INVALID_LAST_NAME");
      }
      updatedProps.lastName = updates.lastName.trim();
    }

    if (updates.dateOfBirth !== undefined) {
      if (updates.dateOfBirth > new Date()) {
        throw new AppError("Date of birth cannot be in the future", 400, "INVALID_DATE_OF_BIRTH");
      }
      updatedProps.dateOfBirth = updates.dateOfBirth;
    }

    if (updates.avatarUrl !== undefined) {
      updatedProps.avatarUrl = updates.avatarUrl;
    }

    updatedProps.updatedAt = new Date();

    return new Profile(updatedProps);
  }
}
