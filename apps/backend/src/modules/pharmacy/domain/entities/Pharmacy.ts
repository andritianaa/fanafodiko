export interface OpeningHour {
  day: number; // 0=Sunday … 6=Saturday
  open?: string; // "08:00"
  close?: string; // "17:00"
  isClosed: boolean;
}

export interface GuardSchedule {
  weekIdentifier: string; // "2026-W22"
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface ExceptionalSchedule {
  id: string;
  type: "opening" | "closure";
  label?: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  startTime?: string; // "HH:MM"
  endTime?: string;   // "HH:MM"
  reason?: string;
}

export interface PharmacyGuardEntry {
  id: string;       // MongoDB ObjectId string
  startDate: Date;
  endDate: Date;
  label?: string;
  isActive: boolean;
}

export type PharmacyContactType =
  | "phone"
  | "email"
  | "whatsapp"
  | "facebook"
  | "other";

export interface PharmacyContact {
  type: PharmacyContactType;
  label?: string;
  value: string;
}

export interface PharmacyProps {
  id?: string;
  name: string;
  address: string;
  landmark?: string;
  coordinates: { lat: number; lng: number };
  phone?: string;
  contacts: PharmacyContact[];
  images: string[];
  city: string;
  region?: string;
  isOpen24h: boolean;
  openingHours: OpeningHour[];
  guardSchedules: GuardSchedule[];
  exceptionalSchedules?: ExceptionalSchedule[];
  pharmacyGuards?: PharmacyGuardEntry[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Pharmacy {
  private constructor(public readonly props: PharmacyProps) {}

  static create(props: PharmacyProps): Pharmacy {
    return new Pharmacy({
      ...props,
      contacts: props.contacts ?? [],
      images: props.images ?? [],
      exceptionalSchedules: props.exceptionalSchedules ?? [],
      pharmacyGuards: props.pharmacyGuards ?? [],
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  static reconstitute(props: PharmacyProps): Pharmacy {
    return new Pharmacy({
      ...props,
      exceptionalSchedules: props.exceptionalSchedules ?? [],
      pharmacyGuards: props.pharmacyGuards ?? [],
    });
  }

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get address() { return this.props.address; }
  get coordinates() { return this.props.coordinates; }
  get city() { return this.props.city; }
  get isOpen24h() { return this.props.isOpen24h; }
  get openingHours() { return this.props.openingHours; }
  get guardSchedules() { return this.props.guardSchedules; }
  get contacts() { return this.props.contacts; }
  get images() { return this.props.images; }

  update(changes: Partial<PharmacyProps>): Pharmacy {
    return new Pharmacy({ ...this.props, ...changes, updatedAt: new Date() });
  }
}
