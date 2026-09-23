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
