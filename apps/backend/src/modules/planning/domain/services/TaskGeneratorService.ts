import { Medication } from "@/modules/medication_management/domain/entities/Medication";
import { MedicationTask } from "../entities/MedicationTask";

export class TaskGeneratorService {
  /**
   * Generates tasks for a medication within a specified time window.
   */
  static generateTasks(
    medication: Medication,
    windowStart: Date,
    windowEnd: Date
  ): MedicationTask[] {
    if (!medication.isActive) return [];

    const tasks: MedicationTask[] = [];
    let currentDay = new Date(windowStart);
    currentDay.setHours(0, 0, 0, 0);

    let dayCount = 0;
    while (currentDay <= windowEnd && dayCount < 365) {
      dayCount++;

      if (this.shouldProcessDay(currentDay, medication)) {
        const dayTasks = this.generateTasksForDay(currentDay, medication, windowStart, windowEnd);
        tasks.push(...dayTasks);
      }

      currentDay = this.addDays(currentDay, 1);
    }

    return tasks;
  }

  private static shouldProcessDay(day: Date, medication: Medication): boolean {
    const medStart = new Date(medication.startDate);
    medStart.setHours(0, 0, 0, 0);

    if (day < medStart) return false;
    if (medication.endDate && day > medication.endDate) return false;

    return this.isDayMatchingFrequency(day, medication.frequency);
  }

  private static isDayMatchingFrequency(day: Date, frequency: any): boolean {
    if (frequency.type !== 'WEEKLY') return true;

    const dayName = day.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    return frequency.days?.includes(dayName) ?? false;
  }

  private static generateTasksForDay(
    day: Date,
    medication: Medication,
    windowStart: Date,
    windowEnd: Date
  ): MedicationTask[] {
    const dayTasks: MedicationTask[] = [];

    for (const timeStr of medication.frequency.times) {
      const taskDate = this.createDateTime(day, timeStr);

      if (this.isTaskDateValid(taskDate, medication, windowStart, windowEnd)) {
        dayTasks.push(MedicationTask.create({
          medicationId: medication.id!,
          profileId: medication.profileId,
          scheduledAt: taskDate
        }));
      }
    }

    return dayTasks;
  }

  private static createDateTime(date: Date, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  }

  private static isTaskDateValid(
    taskDate: Date,
    medication: Medication,
    windowStart: Date,
    windowEnd: Date
  ): boolean {
    const withinWindow = taskDate >= windowStart && taskDate <= windowEnd;
    const withinMedicationDates = taskDate >= medication.startDate && 
                                  (!medication.endDate || taskDate <= medication.endDate);

    return withinWindow && withinMedicationDates;
  }

  private static addDays(date: Date, days: number): Date {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  }
}
