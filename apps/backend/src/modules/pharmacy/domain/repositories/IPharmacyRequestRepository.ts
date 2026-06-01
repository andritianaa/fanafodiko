import { PharmacyRequest, RequestStatus } from "../entities/PharmacyRequest";

export interface IPharmacyRequestRepository {
  findById(id: string): Promise<PharmacyRequest | null>;
  findAll(status?: RequestStatus): Promise<PharmacyRequest[]>;
  save(request: PharmacyRequest): Promise<PharmacyRequest>;
  update(request: PharmacyRequest): Promise<PharmacyRequest>;
}
