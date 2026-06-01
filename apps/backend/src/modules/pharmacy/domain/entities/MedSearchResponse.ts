export interface MedSearchResponseProps {
  id?: string;
  searchId: string;
  pharmacyId: string;
  pharmacyName: string;
  respondedByUserId: string;
  hasStock: boolean;
  note?: string;
  distance?: number;
  respondedAt?: Date;
}

export class MedSearchResponse {
  private constructor(public readonly props: MedSearchResponseProps) {}

  static create(props: MedSearchResponseProps): MedSearchResponse {
    return new MedSearchResponse({ ...props, respondedAt: props.respondedAt ?? new Date() });
  }

  static reconstitute(props: MedSearchResponseProps): MedSearchResponse {
    return new MedSearchResponse(props);
  }

  get id() { return this.props.id; }
  get searchId() { return this.props.searchId; }
  get pharmacyId() { return this.props.pharmacyId; }
}
