import { IPharmacyRepository } from "../../domain/repositories/IPharmacyRepository";
import { AppError } from "@/core/errors/AppError";
import { guardDatesFromWeekId } from "@/core/utils/weekUtils";

export class ToggleGuard {
  constructor(private readonly repo: IPharmacyRepository) {}

  async execute(id: string, weekIdentifier: string, isActive: boolean): Promise<void> {
    const pharmacy = await this.repo.findById(id);
    if (!pharmacy) throw new AppError("Pharmacie introuvable", 404, "NOT_FOUND");

    const { startDate, endDate } = guardDatesFromWeekId(weekIdentifier);
    const schedules = [...pharmacy.guardSchedules];
    const idx = schedules.findIndex((g) => g.weekIdentifier === weekIdentifier);

    if (idx >= 0) {
      schedules[idx] = { weekIdentifier, startDate, endDate, isActive };
    } else {
      schedules.push({ weekIdentifier, startDate, endDate, isActive });
    }

    const updated = pharmacy.update({ guardSchedules: schedules });
    await this.repo.update(updated);
  }
}
