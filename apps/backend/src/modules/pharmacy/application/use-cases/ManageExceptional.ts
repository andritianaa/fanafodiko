import { Types } from "mongoose";
import { IPharmacyRepository } from "../../domain/repositories/IPharmacyRepository";
import { AppError } from "@/core/errors/AppError";
import type {
  CreateExceptionalScheduleInput,
  UpdateExceptionalScheduleInput,
  CreatePharmacyGuardInput,
  UpdatePharmacyGuardInput,
} from "@ext/schemas";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convertit une date "YYYY-MM-DD" et une heure "HH:MM" exprimées en heure
 * locale Madagascar (EAT = UTC+3) en objet Date UTC.
 */
function eatToDate(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  // EAT = UTC+3 → soustraire 3h pour obtenir l'UTC
  return new Date(Date.UTC(year, month - 1, day, hours - 3, minutes, 0, 0));
}

// ─── Ouvertures / fermetures exceptionnelles ──────────────────────────────────

export class AddExceptionalSchedule {
  constructor(private readonly repo: IPharmacyRepository) {}

  async execute(pharmacyId: string, input: CreateExceptionalScheduleInput) {
    const pharmacy = await this.repo.findById(pharmacyId);
    if (!pharmacy) throw new AppError("Pharmacie introuvable", 404, "NOT_FOUND");

    const newEntry = {
      id: new Types.ObjectId().toString(),
      ...input,
    };

    await this.repo.update(
      pharmacy.update({
        exceptionalSchedules: [
          ...(pharmacy.props.exceptionalSchedules ?? []),
          newEntry,
        ],
      })
    );

    return newEntry;
  }
}

export class UpdateExceptionalSchedule {
  constructor(private readonly repo: IPharmacyRepository) {}

  async execute(
    pharmacyId: string,
    scheduleId: string,
    input: UpdateExceptionalScheduleInput
  ) {
    const pharmacy = await this.repo.findById(pharmacyId);
    if (!pharmacy) throw new AppError("Pharmacie introuvable", 404, "NOT_FOUND");

    const schedules = [...(pharmacy.props.exceptionalSchedules ?? [])];
    const idx = schedules.findIndex((s) => s.id === scheduleId);
    if (idx < 0) throw new AppError("Planning introuvable", 404, "NOT_FOUND");

    schedules[idx] = { ...schedules[idx], ...input };

    await this.repo.update(pharmacy.update({ exceptionalSchedules: schedules }));
    return schedules[idx];
  }
}

export class DeleteExceptionalSchedule {
  constructor(private readonly repo: IPharmacyRepository) {}

  async execute(pharmacyId: string, scheduleId: string) {
    const pharmacy = await this.repo.findById(pharmacyId);
    if (!pharmacy) throw new AppError("Pharmacie introuvable", 404, "NOT_FOUND");

    const schedules = (pharmacy.props.exceptionalSchedules ?? []).filter(
      (s) => s.id !== scheduleId
    );

    await this.repo.update(pharmacy.update({ exceptionalSchedules: schedules }));
  }
}

// ─── Gardes déclarées par la pharmacie ────────────────────────────────────────

export class AddPharmacyGuard {
  constructor(private readonly repo: IPharmacyRepository) {}

  async execute(pharmacyId: string, input: CreatePharmacyGuardInput) {
    const pharmacy = await this.repo.findById(pharmacyId);
    if (!pharmacy) throw new AppError("Pharmacie introuvable", 404, "NOT_FOUND");

    const newGuard = {
      id: new Types.ObjectId().toString(),
      startDate: eatToDate(input.startDate, input.startTime),
      endDate: eatToDate(input.endDate, input.endTime),
      label: input.label,
      isActive: true,
    };

    await this.repo.update(
      pharmacy.update({
        pharmacyGuards: [
          ...(pharmacy.props.pharmacyGuards ?? []),
          newGuard,
        ],
      })
    );

    return {
      id: newGuard.id,
      startDate: newGuard.startDate.toISOString(),
      endDate: newGuard.endDate.toISOString(),
      label: newGuard.label,
      isActive: newGuard.isActive,
    };
  }
}

export class UpdatePharmacyGuard {
  constructor(private readonly repo: IPharmacyRepository) {}

  async execute(
    pharmacyId: string,
    guardId: string,
    input: UpdatePharmacyGuardInput
  ) {
    const pharmacy = await this.repo.findById(pharmacyId);
    if (!pharmacy) throw new AppError("Pharmacie introuvable", 404, "NOT_FOUND");

    const guards = [...(pharmacy.props.pharmacyGuards ?? [])];
    const idx = guards.findIndex((g) => g.id === guardId);
    if (idx < 0) throw new AppError("Garde introuvable", 404, "NOT_FOUND");

    const updated = { ...guards[idx] };
    if (input.isActive !== undefined) updated.isActive = input.isActive;
    if (input.label !== undefined) updated.label = input.label;
    if (input.startDate && input.startTime)
      updated.startDate = eatToDate(input.startDate, input.startTime);
    if (input.endDate && input.endTime)
      updated.endDate = eatToDate(input.endDate, input.endTime);
    guards[idx] = updated;

    await this.repo.update(pharmacy.update({ pharmacyGuards: guards }));
    return guards[idx];
  }
}

export class DeletePharmacyGuard {
  constructor(private readonly repo: IPharmacyRepository) {}

  async execute(pharmacyId: string, guardId: string) {
    const pharmacy = await this.repo.findById(pharmacyId);
    if (!pharmacy) throw new AppError("Pharmacie introuvable", 404, "NOT_FOUND");

    const guards = (pharmacy.props.pharmacyGuards ?? []).filter(
      (g) => g.id !== guardId
    );

    await this.repo.update(pharmacy.update({ pharmacyGuards: guards }));
  }
}
