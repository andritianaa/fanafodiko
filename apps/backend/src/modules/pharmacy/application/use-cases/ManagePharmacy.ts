import { AppError } from "@/core/errors/AppError";
import { IPharmacyRepository } from "../../domain/repositories/IPharmacyRepository";
import { IPharmacyMembershipRepository } from "../../domain/repositories/IPharmacyMembershipRepository";
import type {
  UpdatePharmacyInfoInput,
  UpdatePharmacyHoursInput,
} from "@ext/schemas";

/** Infos globales : réservé admin+ (vérifié par le middleware). */
export class UpdatePharmacyInfo {
  constructor(private readonly repo: IPharmacyRepository) {}
  async execute(id: string, input: UpdatePharmacyInfoInput) {
    const pharmacy = await this.repo.findById(id);
    if (!pharmacy) throw new AppError("Pharmacie introuvable", 404, "NOT_FOUND");
    return this.repo.update(pharmacy.update(input as any));
  }
}

/** Horaires : staff+ . */
export class UpdatePharmacyHours {
  constructor(private readonly repo: IPharmacyRepository) {}
  async execute(id: string, input: UpdatePharmacyHoursInput) {
    const pharmacy = await this.repo.findById(id);
    if (!pharmacy) throw new AppError("Pharmacie introuvable", 404, "NOT_FOUND");
    return this.repo.update(
      pharmacy.update({
        openingHours: input.openingHours,
        ...(input.isOpen24h !== undefined ? { isOpen24h: input.isOpen24h } : {}),
      })
    );
  }
}

/** Images : staff+ (remplace la liste complète). */
export class UpdatePharmacyImages {
  constructor(private readonly repo: IPharmacyRepository) {}
  async execute(id: string, images: string[]) {
    const pharmacy = await this.repo.findById(id);
    if (!pharmacy) throw new AppError("Pharmacie introuvable", 404, "NOT_FOUND");
    return this.repo.update(pharmacy.update({ images }));
  }
}

/** Liste les pharmacies dont l'utilisateur est membre (+ son rôle). */
export class GetMyPharmacies {
  constructor(
    private readonly membershipRepo: IPharmacyMembershipRepository,
    private readonly pharmacyRepo: IPharmacyRepository
  ) {}

  async execute(userId: string) {
    const memberships = await this.membershipRepo.findByUser(userId);
    const result = await Promise.all(
      memberships.map(async (m) => {
        const pharmacy = await this.pharmacyRepo.findById(m.pharmacyId);
        if (!pharmacy) return null;
        return {
          id: pharmacy.id!,
          name: pharmacy.props.name,
          city: pharmacy.props.city,
          role: m.role,
        };
      })
    );
    return result.filter((r): r is NonNullable<typeof r> => r !== null);
  }
}
