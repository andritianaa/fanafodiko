import { IPharmacyRepository } from "../../domain/repositories/IPharmacyRepository";
import { guardDatesFromWeekId } from "@/core/utils/weekUtils";
import type { BatchGuardInput } from "@ext/schemas";

export class BatchUpdateGuard {
  constructor(private readonly repo: IPharmacyRepository) {}

  async execute(input: BatchGuardInput): Promise<void> {
    const { pharmacyIds, weekIdentifier, isActive } = input;
    const { startDate, endDate } = guardDatesFromWeekId(weekIdentifier);

    await Promise.all(
      pharmacyIds.map(async (id) => {
        const pharmacy = await this.repo.findById(id);
        if (!pharmacy) return;

        const existingIdx = pharmacy.guardSchedules.findIndex(
          (g) => g.weekIdentifier === weekIdentifier
        );

        const schedules = [...pharmacy.guardSchedules];
        if (existingIdx >= 0) {
          schedules[existingIdx] = { weekIdentifier, startDate, endDate, isActive };
        } else {
          schedules.push({ weekIdentifier, startDate, endDate, isActive });
        }

        const updated = pharmacy.update({ guardSchedules: schedules });
        await this.repo.update(updated);
      })
    );
  }
}
