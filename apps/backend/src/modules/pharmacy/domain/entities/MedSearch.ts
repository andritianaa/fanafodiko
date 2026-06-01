export interface NearbyPharmacy {
  id: string;
  name: string;
  distance: number; // km
  coordinates: { lat: number; lng: number };
}

export interface MedSearchProps {
  id?: string;
  userId: string;
  medicationName: string;
  coordinates: { lat: number; lng: number };
  radiusKm: number;
  note?: string;
  status: "active" | "closed";
  nearbyPharmacies: NearbyPharmacy[];
  expiresAt: Date;
  createdAt?: Date;
}

export class MedSearch {
  private constructor(public readonly props: MedSearchProps) {}

  static create(props: MedSearchProps): MedSearch {
    return new MedSearch({ ...props, createdAt: props.createdAt ?? new Date() });
  }

  static reconstitute(props: MedSearchProps): MedSearch {
    return new MedSearch(props);
  }

  get id() { return this.props.id; }
  get status() { return this.props.status; }

  close(): MedSearch {
    return new MedSearch({ ...this.props, status: "closed" });
  }
}
