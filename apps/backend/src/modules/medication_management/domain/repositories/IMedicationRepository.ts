import { Medication } from "../entities/Medication";

export interface IMedicationRepository {
  save(medication: Medication): Promise<Medication>;
  findById(id: string): Promise<Medication | null>;
  findByProfileId(profileId: string | string[]): Promise<Medication[]>;
  findActiveMedications(): Promise<Medication[]>;
  delete(id: string): Promise<void>;
}
