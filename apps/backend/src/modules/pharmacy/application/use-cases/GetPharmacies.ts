import { IPharmacyRepository } from "../../domain/repositories/IPharmacyRepository";
import { Pharmacy } from "../../domain/entities/Pharmacy";
import { madagascarNow, madagascarToday, isWithinGuardPeriod } from "@/core/utils/weekUtils";

export type PharmacyFilter = "open" | "guard" | "24h" | undefined;

export function isPharmacyOpenNow(pharmacy: Pharmacy): boolean {
  const today = madagascarToday();
  const { hours, minutes, dayOfWeek } = madagascarNow();
  const nowMin = hours * 60 + minutes;

  // Exceptional schedules: check if any apply today (startDate <= today <= endDate)
  const exceptionals = (pharmacy.props.exceptionalSchedules ?? []).filter(
    (s) => s.startDate <= today && s.endDate >= today
  );

  // A closure for today overrides everything (including isOpen24h)
  if (exceptionals.some((s) => s.type === "closure")) return false;

  // An exceptional opening overrides regular hours
  const exceptionalOpening = exceptionals.find((s) => s.type === "opening");
  if (exceptionalOpening) {
    // No times specified → open all day
    if (!exceptionalOpening.startTime || !exceptionalOpening.endTime) return true;
    const [openH, openM] = exceptionalOpening.startTime.split(":").map(Number);
    const [closeH, closeM] = exceptionalOpening.endTime.split(":").map(Number);
    return nowMin >= openH * 60 + openM && nowMin < closeH * 60 + closeM;
  }

  // No exceptional schedule → fall back to regular logic
  if (pharmacy.isOpen24h) return true;

  const todayHours = pharmacy.openingHours.find((h) => h.day === dayOfWeek);
  if (!todayHours || todayHours.isClosed || !todayHours.open || !todayHours.close)
    return false;
  const [openH, openM] = todayHours.open.split(":").map(Number);
  const [closeH, closeM] = todayHours.close.split(":").map(Number);
  return nowMin >= openH * 60 + openM && nowMin < closeH * 60 + closeM;
}

export function isPharmacyOnGuard(pharmacy: Pharmacy): boolean {
  const now = new Date();
  // Gardes assignées par le backoffice (semaine ISO)
  const hasBackofficeGuard = pharmacy.guardSchedules.some(
    (g) =>
      g.isActive &&
      isWithinGuardPeriod(new Date(g.startDate), new Date(g.endDate), now),
  );
  if (hasBackofficeGuard) return true;
  // Gardes déclarées directement par la pharmacie (plage libre)
  return (pharmacy.props.pharmacyGuards ?? []).some(
    (g) =>
      g.isActive &&
      isWithinGuardPeriod(new Date(g.startDate), new Date(g.endDate), now),
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
        // Guard always wins over exceptional closures: onGuard || isPharmacyOpenNow
        const openNow = onGuard || isPharmacyOpenNow(p);
        return { pharmacy: p, isOpenNow: openNow, isOnGuard: onGuard };
      })
      .filter(({ isOpenNow }) => filter !== "open" || isOpenNow);
  }
}
