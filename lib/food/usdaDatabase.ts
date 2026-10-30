import type { FoodDetail, FoodServing } from '@/types';
import { rankEntries, toSearchEntry, type SearchEntry } from './search';

/**
 * The food database bundled in the app: USDA FoodData Central's survey foods
 * (FNDDS, public domain) — about 5,400 everyday foods with real portions like
 * "1 cup" or "1 medium". Searching it is instant and works offline. Rebuild
 * with scripts/build-food-database.js.
 */

/** [fdcId, name, category, kcal, protein, carbs, fat (per 100 g), portions [description, grams][]] */
export type UsdaRow = [number, string, string, number, number, number, number, [string, number][]];

interface Indexed {
  row: UsdaRow;
  entry: SearchEntry;
}

let index: Indexed[] | null = null;
let byId: Map<string, UsdaRow> | null = null;

function load(): Indexed[] {
  if (!index) {
    // Required lazily, so the ~860 KB of data is only parsed the first time someone searches.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const data = require('@/assets/data/usda-foods.json') as { foods: UsdaRow[] };
    index = data.foods.map((row) => ({ row, entry: toSearchEntry(row[1], row[2]) }));
    byId = new Map(data.foods.map((row) => [String(row[0]), row]));
  }
  return index;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

export const HUNDRED_GRAMS_ID = '100g';

/** Turns a database row into a food with servings: its portions (first is the default), then 100 g. */
export function usdaRowToFood(row: UsdaRow): FoodDetail {
  const [id, name, category, kcal, protein, carbs, fat, portions] = row;
  const per = (grams: number) => ({
    calories: round1((kcal * grams) / 100),
    protein: round1((protein * grams) / 100),
    carbs: round1((carbs * grams) / 100),
    fat: round1((fat * grams) / 100),
  });

  const seen = new Set<string>();
  const servings: FoodServing[] = [];
  for (const [description, grams] of portions) {
    const servingId = `portion:${description}`;
    if (seen.has(servingId) || !(grams > 0)) continue;
    seen.add(servingId);
    servings.push({ id: servingId, description: `${description} (${round1(grams)} g)`, metricAmount: grams, metricUnit: 'g', isDefault: servings.length === 0, ...per(grams) });
  }
  servings.push({ id: HUNDRED_GRAMS_ID, description: '100 g', metricAmount: 100, metricUnit: 'g', isDefault: servings.length === 0, ...per(100) });

  return { id: `usda:${id}`, source: 'usda', externalId: String(id), name, brand: null, category: category || null, servings };
}

export function searchUsdaFoods(query: string, limit = 25): FoodDetail[] {
  return rankEntries(query, load(), (item) => item.entry, limit).map((item) => usdaRowToFood(item.row));
}

export function getUsdaFood(fdcId: string): FoodDetail | null {
  load();
  const row = byId?.get(fdcId);
  return row ? usdaRowToFood(row) : null;
}
