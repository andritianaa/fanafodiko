import { Pharmacy } from "../entities/Pharmacy";

export interface PharmacyFilter {
  onlyGuard?: boolean;
  only24h?: boolean;
}

export interface IPharmacyRepository {
  findAll(filter?: PharmacyFilter): Promise<Pharmacy[]>;
  findById(id: string): Promise<Pharmacy | null>;
  search(query: string): Promise<Pharmacy[]>;
  save(pharmacy: Pharmacy): Promise<Pharmacy>;
  update(pharmacy: Pharmacy): Promise<Pharmacy>;
  delete(id: string): Promise<void>;
}
