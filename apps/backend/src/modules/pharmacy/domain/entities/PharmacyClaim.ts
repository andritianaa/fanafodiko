export type ClaimStatus = "pending" | "approved" | "rejected";

export interface PharmacyClaimProps {
  id?: string;
  pharmacyId: string;
  pharmacyName: string;
  submittedBy: string; // userId
  submittedByEmail: string;
  contactInfo: string;
  proofImages: string[];
  status: ClaimStatus;
  rejectionReason?: string;
  createdAt?: Date;
}

export class PharmacyClaim {
  constructor(public readonly props: PharmacyClaimProps) {}

  get id() { return this.props.id; }
  get pharmacyId() { return this.props.pharmacyId; }
  get pharmacyName() { return this.props.pharmacyName; }
  get submittedBy() { return this.props.submittedBy; }
  get submittedByEmail() { return this.props.submittedByEmail; }
  get contactInfo() { return this.props.contactInfo; }
  get proofImages() { return this.props.proofImages; }
  get status() { return this.props.status; }
  get rejectionReason() { return this.props.rejectionReason; }
  get createdAt() { return this.props.createdAt; }

  approve(): PharmacyClaim {
    return new PharmacyClaim({ ...this.props, status: "approved" });
  }

  reject(reason?: string): PharmacyClaim {
    return new PharmacyClaim({ ...this.props, status: "rejected", rejectionReason: reason });
  }

  static create(props: Omit<PharmacyClaimProps, "id" | "status" | "createdAt">): PharmacyClaim {
    return new PharmacyClaim({ ...props, status: "pending" });
  }
}
