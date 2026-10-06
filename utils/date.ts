export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Local-calendar date key (YYYY-MM-DD). Deliberately not toISOString(), which would shift days across UTC. */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Local midnight for a YYYY-MM-DD key, or null if the key isn't a real date. */
export function parseDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

/** [start, end) of a local calendar day — 23 or 25 hours long across a DST change. */
export function dayRange(date: Date): { start: Date; end: Date } {
  const start = startOfDay(date);
  return { start, end: addDays(start, 1) };
}

export function getGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const longDateFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const shortDateFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/** "Tuesday, September 23" */
export function formatLongDate(date: Date): string {
  return longDateFormatter.format(date);
}

/** "Today" / "Yesterday" / "Tomorrow", otherwise "Mon, Sep 22". */
export function formatRelativeDay(date: Date, today: Date = new Date()): string {
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, addDays(today, -1))) return 'Yesterday';
  if (isSameDay(date, addDays(today, 1))) return 'Tomorrow';
  return shortDateFormatter.format(date);
}
