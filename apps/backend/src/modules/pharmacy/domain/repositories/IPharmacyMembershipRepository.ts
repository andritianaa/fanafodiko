import { PharmacyMembership } from "../entities/PharmacyMembership";

export interface IPharmacyMembershipRepository {
  findByPharmacyAndUser(pharmacyId: string, userId: string): Promise<PharmacyMembership | null>;
  findByPharmacy(pharmacyId: string): Promise<PharmacyMembership[]>;
  findByUser(userId: string): Promise<PharmacyMembership[]>;
  save(membership: PharmacyMembership): Promise<PharmacyMembership>;
  delete(pharmacyId: string, userId: string): Promise<void>;
}
