import { IPharmacyRepository } from "../../domain/repositories/IPharmacyRepository";
import { Pharmacy } from "../../domain/entities/Pharmacy";
import type { CreatePharmacyInput } from "@ext/schemas";

export class CreatePharmacy {
  constructor(private readonly repo: IPharmacyRepository) {}

  async execute(input: CreatePharmacyInput): Promise<Pharmacy> {
    const pharmacy = Pharmacy.create({
      name: input.name,
      address: input.address,
      landmark: input.landmark,
      coordinates: input.coordinates,
      phone: input.phone,
      contacts: input.contacts ?? [],
      images: input.images ?? [],
      city: input.city,
      region: input.region,
      isOpen24h: input.isOpen24h ?? false,
      openingHours: input.openingHours ?? [],
      guardSchedules: [],
    });
    return this.repo.save(pharmacy);
  }
}
