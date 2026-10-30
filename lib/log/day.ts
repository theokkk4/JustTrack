import type { LogEntry } from '@/types';
import { dayRange } from '@/utils/date';

/** The log keeps everything; screens look at one local calendar day at a time. */

export function loggedOn(entry: Pick<LogEntry, 'loggedAt'>, day: Date): boolean {
  const loggedAt = Date.parse(entry.loggedAt);
  if (!Number.isFinite(loggedAt)) return false;
  const { start, end } = dayRange(day);
  return loggedAt >= start.getTime() && loggedAt < end.getTime();
}

/** The entries logged on `day`, oldest first. */
export function entriesOnDay(entries: readonly LogEntry[], day: Date): LogEntry[] {
  return entries.filter((entry) => loggedOn(entry, day)).sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
}

/** Calories logged on each of the given days, in order. */
export function caloriesByDay(entries: readonly LogEntry[], days: readonly Date[]): number[] {
  return days.map((day) => entriesOnDay(entries, day).reduce((sum, entry) => sum + entry.calories, 0));
}
