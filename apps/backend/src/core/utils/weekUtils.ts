const EAT_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3

/** Returns the current week identifier in "YYYY-WXX" format (ISO 8601). */
export function currentWeekIdentifier(): string {
  return dateToWeekIdentifier(new Date());
}

export function dateToWeekIdentifier(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  // Thursday in current week → identifies the ISO year
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const year = d.getUTCFullYear();
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * Computes guard startDate and endDate from a week identifier.
 * Guard runs from Saturday 14:00 EAT to the following Saturday 08:00 EAT.
 */
export function guardDatesFromWeekId(weekId: string): { startDate: Date; endDate: Date } {
  const [yearStr, weekStr] = weekId.split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  // ISO week Monday = day 1; Saturday = day 6 (Monday + 5)
  const mondayOfWeek = isoWeekMonday(year, week);
  const saturday = new Date(mondayOfWeek);
  saturday.setUTCDate(mondayOfWeek.getUTCDate() + 5);

  // Saturday 14:00 EAT = Saturday 11:00 UTC
  const startDate = new Date(saturday);
  startDate.setUTCHours(11, 0, 0, 0);

  // Following Saturday 08:00 EAT = following Saturday 05:00 UTC
  const endDate = new Date(saturday);
  endDate.setUTCDate(saturday.getUTCDate() + 7);
  endDate.setUTCHours(5, 0, 0, 0);

  return { startDate, endDate };
}

function isoWeekMonday(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4)); // Jan 4 is always in week 1
  const jan4DayOfWeek = jan4.getUTCDay() || 7; // 1=Mon … 7=Sun
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (jan4DayOfWeek - 1) + (week - 1) * 7);
  return monday;
}

/** Returns true if `now` falls between startDate and endDate (inclusive). */
export function isWithinGuardPeriod(startDate: Date, endDate: Date, now = new Date()): boolean {
  return now >= startDate && now <= endDate;
}

/** Madagascar time (EAT, UTC+3): returns { hours, minutes, dayOfWeek (0=Sun) } */
export function madagascarNow(): { hours: number; minutes: number; dayOfWeek: number } {
  const now = new Date();
  const eat = new Date(now.getTime() + EAT_OFFSET_MS);
  return {
    hours: eat.getUTCHours(),
    minutes: eat.getUTCMinutes(),
    dayOfWeek: eat.getUTCDay(),
  };
}
