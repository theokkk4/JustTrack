import type { LogEntry } from '@/types';

/** How long an entry is remembered. The product promise: one day, then it's gone. */
export const LOG_WINDOW_MS = 24 * 60 * 60 * 1000;

export function expiresAt(entry: Pick<LogEntry, 'loggedAt'>): number {
  return Date.parse(entry.loggedAt) + LOG_WINDOW_MS;
}

export function isLive(entry: Pick<LogEntry, 'loggedAt'>, now: number): boolean {
  const loggedAt = Date.parse(entry.loggedAt);
  return Number.isFinite(loggedAt) && loggedAt <= now && now - loggedAt < LOG_WINDOW_MS;
}

/** Entries still inside the 24-hour window, oldest first. */
export function liveEntries(entries: readonly LogEntry[], now: number): LogEntry[] {
  return entries.filter((entry) => isLive(entry, now)).sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
}

/** Milliseconds until the next entry expires, or null when nothing is pending. */
export function msUntilNextExpiry(entries: readonly LogEntry[], now: number): number | null {
  let next = Infinity;
  for (const entry of entries) {
    if (isLive(entry, now)) next = Math.min(next, expiresAt(entry) - now);
  }
  return Number.isFinite(next) ? Math.max(next, 0) : null;
}

/** "in 3h 20m", "in 45m", "in a moment". */
export function describeTimeLeft(ms: number): string {
  const minutes = Math.ceil(ms / 60_000);
  if (ms < 60_000) return 'in a moment';
  if (minutes < 60) return `in ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `in ${hours}h` : `in ${hours}h ${rest}m`;
}
