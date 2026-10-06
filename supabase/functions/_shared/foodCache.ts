import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

import { Endpoints, fatsecretGet } from './fatsecret.ts';
import { HttpError } from './http.ts';
import { normalizeFood, type FoodDetail } from './normalize.ts';

/** Under FatSecret's 24h limit, with margin; the scheduled purge uses the same window. */
const MAX_AGE_MS = 23 * 60 * 60 * 1000;

export interface CachedFood extends FoodDetail {
  /** When this content was obtained from FatSecret; clients must not keep it past 24h. */
  fetchedAt: string;
}

export async function saveToCache(admin: SupabaseClient, food: FoodDetail, fetchedAt: string): Promise<void> {
  const { error } = await admin
    .from('fatsecret_food_cache')
    .upsert({ food_id: food.id, payload: food, fetched_at: fetchedAt }, { onConflict: 'food_id' });
  if (error) console.error('Failed to cache FatSecret food', food.id, error.message);
}

async function fetchFood(id: string): Promise<FoodDetail | null> {
  try {
    const raw = (await fatsecretGet(Endpoints.getFood, { food_id: id })) as { food?: unknown };
    return normalizeFood(raw.food);
  } catch (error) {
    if (error instanceof HttpError && error.code === 'not_found') return null;
    throw error;
  }
}

/** Resolves food IDs from the <23h cache, fetching (and caching) whatever's missing or stale. */
export async function getFoods(admin: SupabaseClient, ids: string[]): Promise<{ foods: CachedFood[]; missing: string[] }> {
  const freshSince = new Date(Date.now() - MAX_AGE_MS).toISOString();
  const { data: cachedRows, error } = await admin
    .from('fatsecret_food_cache')
    .select('food_id, payload, fetched_at')
    .in('food_id', ids)
    .gt('fetched_at', freshSince);
  if (error) console.error('FatSecret cache read failed', error.message);

  const byId = new Map<string, CachedFood>();
  for (const row of cachedRows ?? []) {
    byId.set(row.food_id as string, { ...(row.payload as FoodDetail), fetchedAt: row.fetched_at as string });
  }

  const toFetch = ids.filter((id) => !byId.has(id));
  const missing: string[] = [];
  // Small batches keep a burst of lookups polite to FatSecret's rate limit.
  for (let index = 0; index < toFetch.length; index += 5) {
    const batch = toFetch.slice(index, index + 5);
    // Stamped before the request, so the 24h clock can only run early, never late.
    const fetchedAt = new Date().toISOString();
    const results = await Promise.allSettled(batch.map(fetchFood));
    let failure: unknown = null;
    await Promise.all(
      results.map(async (result, position) => {
        if (result.status === 'rejected') {
          failure ??= result.reason;
          return;
        }
        if (!result.value) {
          missing.push(batch[position]);
          return;
        }
        byId.set(result.value.id, { ...result.value, fetchedAt });
        await saveToCache(admin, result.value, fetchedAt);
      })
    );
    // Whatever did arrive is cached, so a retry after e.g. a rate limit costs less.
    if (failure) throw failure;
  }

  return { foods: ids.map((id) => byId.get(id)).filter((food): food is CachedFood => food !== undefined), missing };
}
