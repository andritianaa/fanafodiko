export type InvitableRole = "admin" | "staff";
export type InvitationStatus = "pending" | "accepted" | "expired";

export interface PharmacyInvitationProps {
  id?: string;
  pharmacyId: string;
  email: string;
  role: InvitableRole;
  token: string;
  invitedBy: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt?: Date;
}

export class PharmacyInvitation {
  private constructor(public readonly props: PharmacyInvitationProps) {}

  static create(props: PharmacyInvitationProps): PharmacyInvitation {
    return new PharmacyInvitation({
      ...props,
      createdAt: props.createdAt ?? new Date(),
    });
  }

  static reconstitute(props: PharmacyInvitationProps): PharmacyInvitation {
    return new PharmacyInvitation(props);
  }

  get id() { return this.props.id; }
  get token() { return this.props.token; }
  get email() { return this.props.email; }
  get role() { return this.props.role; }
  get pharmacyId() { return this.props.pharmacyId; }

  isValid(): boolean {
    return this.props.status === "pending" && this.props.expiresAt > new Date();
  }

  accept(): PharmacyInvitation {
    return new PharmacyInvitation({ ...this.props, status: "accepted" });
  }
}
