import { OpeningHour, PharmacyContact } from "./Pharmacy";

export interface PharmacyRequestPayload {
  name: string;
  address: string;
  landmark?: string;
  coordinates: { lat: number; lng: number };
  contacts: PharmacyContact[];
  city: string;
  region?: string;
  isOpen24h: boolean;
  openingHours: OpeningHour[];
}

export type RequestStatus = "pending" | "approved" | "rejected";
export type ManagementStatus = "none" | "pending" | "approved" | "rejected";

export interface PharmacyRequestProps {
  id?: string;
  submittedBy: string; // userId
  payload: PharmacyRequestPayload;
  wantsToManage: boolean;
  proofImages: string[];
  status: RequestStatus;
  managementStatus: ManagementStatus;
  rejectionReason?: string;
  createdPharmacyId?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt?: Date;
}

export class PharmacyRequest {
  private constructor(public readonly props: PharmacyRequestProps) {}

  static create(props: PharmacyRequestProps): PharmacyRequest {
    return new PharmacyRequest({
      ...props,
      createdAt: props.createdAt ?? new Date(),
    });
  }

  static reconstitute(props: PharmacyRequestProps): PharmacyRequest {
    return new PharmacyRequest(props);
  }

  get id() { return this.props.id; }
  get submittedBy() { return this.props.submittedBy; }

  update(changes: Partial<PharmacyRequestProps>): PharmacyRequest {
    return new PharmacyRequest({ ...this.props, ...changes });
  }
}
