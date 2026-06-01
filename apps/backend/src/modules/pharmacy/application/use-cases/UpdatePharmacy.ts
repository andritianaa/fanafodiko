import { IPharmacyRepository } from "../../domain/repositories/IPharmacyRepository";
import { AppError } from "@/core/errors/AppError";
import type { UpdatePharmacyInput } from "@ext/schemas";

export class UpdatePharmacy {
  constructor(private readonly repo: IPharmacyRepository) {}

  async execute(id: string, input: UpdatePharmacyInput) {
    const pharmacy = await this.repo.findById(id);
    if (!pharmacy) throw new AppError("Pharmacie introuvable", 404, "NOT_FOUND");
    const updated = pharmacy.update(input as any);
    return this.repo.update(updated);
  }
}
