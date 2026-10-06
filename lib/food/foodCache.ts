import type { CachedFood } from '@/types';

/**
 * FatSecret content held for display, in memory only.
 *
 * Their terms allow keeping food names and nutrition for less than 24 hours,
 * so nothing here is ever written to disk, and each food is dropped 23 hours
 * after the server obtained it (`fetchedAt`) — not after we received it.
 * Diary rows themselves store only IDs, so they're re-resolved from here.
 */

export const MAX_FOOD_AGE_MS = 23 * 60 * 60 * 1000;

export type FoodSnapshot = ReadonlyMap<string, CachedFood>;

let snapshot: FoodSnapshot = new Map();
const listeners = new Set<() => void>();
let pruneTimer: ReturnType<typeof setTimeout> | null = null;

export function isFresh(food: CachedFood, now: number = Date.now()): boolean {
  const fetchedAt = Date.parse(food.fetchedAt);
  return Number.isFinite(fetchedAt) && now - fetchedAt < MAX_FOOD_AGE_MS;
}

function publish(next: FoodSnapshot) {
  snapshot = next;
  schedulePrune();
  listeners.forEach((listener) => listener());
}

/** Drops the moment the oldest food expires, so stale content never lingers on screen. */
function schedulePrune() {
  if (pruneTimer) clearTimeout(pruneTimer);
  pruneTimer = null;
  let oldest = Infinity;
  snapshot.forEach((food) => {
    oldest = Math.min(oldest, Date.parse(food.fetchedAt));
  });
  if (!Number.isFinite(oldest)) return;
  pruneTimer = setTimeout(() => pruneFoodCache(), Math.max(oldest + MAX_FOOD_AGE_MS - Date.now(), 0) + 1000);
}

export function getFoodSnapshot(): FoodSnapshot {
  return snapshot;
}

export function subscribeToFoodCache(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** A cached food, only while it's still fresh. */
export function getCachedFood(id: string, now: number = Date.now()): CachedFood | undefined {
  const food = snapshot.get(id);
  return food && isFresh(food, now) ? food : undefined;
}

export function cacheFoods(foods: readonly CachedFood[], now: number = Date.now()): void {
  const fresh = foods.filter((food) => isFresh(food, now));
  if (fresh.length === 0) return;
  const next = new Map(snapshot);
  fresh.forEach((food) => next.set(food.id, food));
  publish(next);
}

/** Removes anything 23 hours old or older. Returns how many foods were dropped. */
export function pruneFoodCache(now: number = Date.now()): number {
  const next = new Map([...snapshot].filter(([, food]) => isFresh(food, now)));
  const dropped = snapshot.size - next.size;
  if (dropped > 0) publish(next);
  else schedulePrune();
  return dropped;
}

/** On sign-out: the next person on this device shouldn't see what the last one looked up. */
export function clearFoodCache(): void {
  if (snapshot.size === 0) return;
  publish(new Map());
}
