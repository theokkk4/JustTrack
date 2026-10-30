import { createPersistedStore } from '@/lib/storage/persistedStore';
import type { AmountUnit, FoodSource, LogEntry, MealType } from '@/types';
import { MEAL_TYPES } from '@/constants/nutrition';
import { liveEntries } from './window';

/** The on-device log. Saved as one JSON array; entries past 24 hours are dropped on every read. */

const SOURCES: readonly FoodSource[] = ['usda', 'openfoodfacts', 'custom', 'ai_estimate'];
const AMOUNT_UNITS: readonly AmountUnit[] = ['serving', 'g', 'ml'];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

/** Accepts only well-formed entries, so a corrupt save can't crash the app. */
export function parseEntry(raw: unknown): LogEntry | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const item = raw as Record<string, unknown>;
  if (
    typeof item.id !== 'string' ||
    typeof item.loggedAt !== 'string' ||
    !oneOf<MealType>(item.mealType, MEAL_TYPES) ||
    !oneOf(item.source, SOURCES) ||
    typeof item.foodName !== 'string' ||
    !isFiniteNumber(item.servings) ||
    !oneOf(item.amountUnit, AMOUNT_UNITS) ||
    !isFiniteNumber(item.grams) ||
    !isFiniteNumber(item.calories) ||
    !isFiniteNumber(item.protein) ||
    !isFiniteNumber(item.carbs) ||
    !isFiniteNumber(item.fat)
  ) {
    return null;
  }
  return {
    id: item.id,
    loggedAt: item.loggedAt,
    mealType: item.mealType,
    source: item.source,
    externalFoodId: typeof item.externalFoodId === 'string' ? item.externalFoodId : null,
    externalServingId: typeof item.externalServingId === 'string' ? item.externalServingId : null,
    foodName: item.foodName,
    brand: typeof item.brand === 'string' ? item.brand : null,
    servings: item.servings,
    amountUnit: item.amountUnit,
    grams: item.grams,
    isEstimate: item.isEstimate === true,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
  };
}

function parseEntries(raw: unknown): LogEntry[] | null {
  if (!Array.isArray(raw)) return null;
  return liveEntries(
    raw.map(parseEntry).filter((entry): entry is LogEntry => entry !== null),
    Date.now()
  );
}

export const logStore = createPersistedStore<LogEntry[]>('justtrack.log.v1', [], parseEntries);

export function addEntries(entries: readonly LogEntry[]): void {
  logStore.set((current) => [...current, ...entries]);
}

export function updateEntry(id: string, update: (entry: LogEntry) => LogEntry): void {
  logStore.set((current) => current.map((entry) => (entry.id === id ? update(entry) : entry)));
}

export function removeEntry(id: string): void {
  logStore.set((current) => current.filter((entry) => entry.id !== id));
}

export function clearLog(): void {
  logStore.set([]);
}

/** Drops expired entries from storage. Returns true if anything was removed. */
export function pruneLog(now: number): boolean {
  const current = logStore.getSnapshot();
  const live = liveEntries(current, now);
  if (live.length === current.length) return false;
  logStore.set(live);
  return true;
}
