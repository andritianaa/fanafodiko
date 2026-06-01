import { PharmacyInvitation } from "../entities/PharmacyInvitation";

export interface IPharmacyInvitationRepository {
  findByToken(token: string): Promise<PharmacyInvitation | null>;
  findPendingByPharmacyAndEmail(pharmacyId: string, email: string): Promise<PharmacyInvitation | null>;
  save(invitation: PharmacyInvitation): Promise<PharmacyInvitation>;
  update(invitation: PharmacyInvitation): Promise<PharmacyInvitation>;
}
