import { createPersistedStore } from '@/lib/storage/persistedStore';
import type { AmountUnit, FoodSource, LogEntry, MealType } from '@/types';
import { MEAL_TYPES } from '@/constants/nutrition';

/** The on-device log. Saved as one JSON array; nothing leaves the device and nothing expires. */

const SOURCES: readonly FoodSource[] = ['usda', 'openfoodfacts', 'chain', 'custom', 'ai_estimate'];
const AMOUNT_UNITS: readonly AmountUnit[] = ['serving', 'g', 'ml'];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** A product URL or a small inline thumbnail; anything else (or anything huge) is dropped. */
const MAX_IMAGE_URI_LENGTH = 120_000;
function isImageUri(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_IMAGE_URI_LENGTH && (value.startsWith('https://') || value.startsWith('data:image/') || value.startsWith('file://'));
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
    imageUri: isImageUri(item.imageUri) ? item.imageUri : null,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
  };
}

function parseEntries(raw: unknown): LogEntry[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.map(parseEntry).filter((entry): entry is LogEntry => entry !== null);
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
