import { IMedicationRepository } from "@/modules/medication_management/domain/repositories/IMedicationRepository";
import { ITaskRepository } from "../../domain/repositories/ITaskRepository";
import { TaskGeneratorService } from "../../domain/services/TaskGeneratorService";

const WINDOW_HOURS = 24;

/**
 * Synchronise les tâches planifiées avec l'état actuel des médicaments.
 * Doit tourner toutes les 5 minutes.
 *
 * Ce que ça gère :
 *  - Nouveau traitement       → les tâches sont générées dans les 5 prochaines minutes
 *  - Modification des horaires → supprime les futures tâches non encore notifiées, régénère
 *  - Désactivation            → supprime les futures tâches du médicament
 *  - Suppression              → supprime les futures tâches orphelines (médicament introuvable)
 */
export class SyncMedicationTasks {
  constructor(
    private readonly medicationRepo: IMedicationRepository,
    private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(): Promise<void> {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + WINDOW_HOURS * 60 * 60 * 1000);

    // ── Étape 1 : Nettoyage des tâches orphelines ─────────────────────────────
    // Trouve toutes les tâches futures PENDING et supprime celles dont le
    // médicament a été supprimé ou désactivé.
    const futurePending = await this.taskRepo.findFuturePending(now);

    for (const task of futurePending) {
      const med = await this.medicationRepo.findById(task.medicationId);
      const isOrphaned = !med || !med.isActive || (med.endDate && med.endDate < now);
      if (isOrphaned) {
        await this.taskRepo.deleteById(task.id!);
      }
    }

    // ── Étape 2 : Synchronisation des médicaments actifs ─────────────────────
    // Pour chaque médicament actif :
    //   a) Supprime les futures tâches non encore notifiées
    //      → Si les horaires ont changé, les anciennes tâches disparaissent
    //   b) Régénère les tâches sur la fenêtre de 24h selon la config actuelle
    const activeMeds = await this.medicationRepo.findActiveMedications();

    for (const med of activeMeds) {
      // Supprime uniquement les tâches non notifiées (celles déjà notifiées
      // restent : l'utilisateur doit encore confirmer ou passer sa prise)
      await this.taskRepo.deleteUnnotifiedFutureByMedicationId(med.id!, now);

      // Régénère selon la configuration actuelle (horaires, jours, dates)
      const tasks = TaskGeneratorService.generateTasks(med, now, windowEnd);
      if (tasks.length > 0) {
        await this.taskRepo.saveMany(tasks);
      }
    }
  }
}
