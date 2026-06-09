import type { PharmacyClaim } from "../entities/PharmacyClaim";

export interface IPharmacyClaimRepository {
  save(claim: PharmacyClaim): Promise<PharmacyClaim>;
  findById(id: string): Promise<PharmacyClaim | null>;
  findAll(): Promise<{ claims: PharmacyClaim[]; total: number }>;
  update(claim: PharmacyClaim): Promise<PharmacyClaim>;
}
