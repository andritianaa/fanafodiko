import { IPharmacyRepository } from "../../domain/repositories/IPharmacyRepository";
import { AppError } from "@/core/errors/AppError";

export class DeletePharmacy {
  constructor(private readonly repo: IPharmacyRepository) {}

  async execute(id: string): Promise<void> {
    const pharmacy = await this.repo.findById(id);
    if (!pharmacy) throw new AppError("Pharmacie introuvable", 404, "NOT_FOUND");
    await this.repo.delete(id);
  }
}
