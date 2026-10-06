import { cacheFoods, getCachedFood } from '@/lib/food/foodCache';
import { FunctionCallError, invokeFunction } from '@/lib/supabase/functions';
import type { CachedFood, FoodSearchPage } from '@/types';

/** fatsecret-food accepts at most 50 IDs per call. */
const MAX_IDS_PER_REQUEST = 50;
const FATSECRET_ID = /^\d{1,20}$/;

export function searchFoods(query: string, page = 0, signal?: AbortSignal): Promise<FoodSearchPage> {
  return invokeFunction<FoodSearchPage>('fatsecret-search', { query: query.trim(), page }, signal);
}

/**
 * Names and nutrition for FatSecret food IDs: from the in-memory cache while
 * fresh, otherwise from the server (which has its own under-24h cache).
 * `missing` lists IDs FatSecret no longer has.
 */
export async function fetchFoods(ids: readonly string[]): Promise<{ foods: CachedFood[]; missing: string[] }> {
  const foods: CachedFood[] = [];
  const missing: string[] = [];
  const toFetch: string[] = [];
  for (const id of new Set(ids)) {
    const cached = getCachedFood(id);
    if (cached) foods.push(cached);
    else if (FATSECRET_ID.test(id)) toFetch.push(id);
    else missing.push(id);
  }

  for (let index = 0; index < toFetch.length; index += MAX_IDS_PER_REQUEST) {
    const batch = toFetch.slice(index, index + MAX_IDS_PER_REQUEST);
    const result = await invokeFunction<{ foods?: CachedFood[]; missing?: string[] }>('fatsecret-food', { ids: batch });
    const fetched = Array.isArray(result.foods) ? result.foods : [];
    cacheFoods(fetched);
    foods.push(...fetched);
    missing.push(...(Array.isArray(result.missing) ? result.missing : []));
  }
  return { foods, missing };
}

export async function getFood(id: string): Promise<CachedFood> {
  const { foods } = await fetchFoods([id]);
  const food = foods.find((candidate) => candidate.id === id);
  if (!food) {
    throw new FunctionCallError('not_found', 'We couldn’t find that food. It may have been removed from the database.', 404);
  }
  return food;
}
