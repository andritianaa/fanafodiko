import { AppError } from "@/core/errors/AppError";
import { Relationship } from "../value-objects/Relationship";

export interface ProfileProps {
  id?: string;
  accountId: string;
  fullName: string;
  relationship: Relationship;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Profile {
  private constructor(public readonly props: ProfileProps) {}

  static create(props: ProfileProps): Profile {
    if (!props.fullName || props.fullName.trim().length === 0) {
      throw new AppError("Full name cannot be empty", 400, "INVALID_FULL_NAME");
    }

    if (!props.accountId || props.accountId.trim().length === 0) {
      throw new AppError("Account ID is required", 400, "INVALID_ACCOUNT_ID");
    }

    const now = new Date();
    return new Profile({
      ...props,
      fullName: props.fullName.trim(),
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    });
  }

  static reconstitute(props: ProfileProps): Profile {
    return new Profile(props);
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get accountId(): string {
    return this.props.accountId;
  }

  get fullName(): string {
    return this.props.fullName;
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

  updateProfile(updates: {
    fullName?: string;
    avatarUrl?: string;
  }): Profile {
    const updatedProps = { ...this.props };

    if (updates.fullName !== undefined) {
      if (!updates.fullName || updates.fullName.trim().length === 0) {
        throw new AppError("Full name cannot be empty", 400, "INVALID_FULL_NAME");
      }
      updatedProps.fullName = updates.fullName.trim();
    }

    if (updates.avatarUrl !== undefined) {
      updatedProps.avatarUrl = updates.avatarUrl;
    }

    updatedProps.updatedAt = new Date();

    return new Profile(updatedProps);
  }
}
