import { IPharmacyRepository } from "../../domain/repositories/IPharmacyRepository";
import { Pharmacy } from "../../domain/entities/Pharmacy";
import { madagascarNow, isWithinGuardPeriod } from "@/core/utils/weekUtils";

export type PharmacyFilter = "open" | "guard" | "24h" | undefined;

function isPharmacyOpenNow(pharmacy: Pharmacy): boolean {
  if (pharmacy.isOpen24h) return true;
  const { hours, minutes, dayOfWeek } = madagascarNow();
  const todayHours = pharmacy.openingHours.find((h) => h.day === dayOfWeek);
  if (!todayHours || todayHours.isClosed || !todayHours.open || !todayHours.close) return false;
  const [openH, openM] = todayHours.open.split(":").map(Number);
  const [closeH, closeM] = todayHours.close.split(":").map(Number);
  const nowMin = hours * 60 + minutes;
  return nowMin >= openH * 60 + openM && nowMin < closeH * 60 + closeM;
}

function isPharmacyOnGuard(pharmacy: Pharmacy): boolean {
  const now = new Date();
  return pharmacy.guardSchedules.some(
    (g) => g.isActive && isWithinGuardPeriod(new Date(g.startDate), new Date(g.endDate), now)
  );
}

export class GetPharmacies {
  constructor(private readonly repo: IPharmacyRepository) {}

  async execute(filter?: PharmacyFilter) {
    let repoFilter = {};
    if (filter === "guard") repoFilter = { onlyGuard: true };
    if (filter === "24h") repoFilter = { only24h: true };

    const pharmacies = await this.repo.findAll(repoFilter);

    return pharmacies
      .map((p) => {
        const onGuard = isPharmacyOnGuard(p);
        const openNow = isPharmacyOpenNow(p) || onGuard;
        return { pharmacy: p, isOpenNow: openNow, isOnGuard: onGuard };
      })
      .filter(({ isOpenNow }) => filter !== "open" || isOpenNow);
  }
}
