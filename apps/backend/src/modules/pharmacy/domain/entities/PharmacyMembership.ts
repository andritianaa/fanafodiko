import { PharmacyRole } from "../value-objects/PharmacyRole";

export interface PharmacyMembershipProps {
  id?: string;
  pharmacyId: string;
  userId: string;
  role: PharmacyRole;
  createdAt?: Date;
}

export class PharmacyMembership {
  private constructor(public readonly props: PharmacyMembershipProps) {}

  static create(props: PharmacyMembershipProps): PharmacyMembership {
    return new PharmacyMembership({
      ...props,
      createdAt: props.createdAt ?? new Date(),
    });
  }

  static reconstitute(props: PharmacyMembershipProps): PharmacyMembership {
    return new PharmacyMembership(props);
  }

  get id() { return this.props.id; }
  get pharmacyId() { return this.props.pharmacyId; }
  get userId() { return this.props.userId; }
  get role() { return this.props.role; }

  withRole(role: PharmacyRole): PharmacyMembership {
    return new PharmacyMembership({ ...this.props, role });
  }
}
