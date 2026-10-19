import type { FoodDetail } from '@/types';
import { getOpenFoodFactsProduct } from './openFoodFacts';
import { getUsdaFood } from './usdaDatabase';

/**
 * Looks foods up by key ("usda:2705483", "off:0894700010137"). Built-in foods
 * come straight from the bundled database; packaged foods the user has seen
 * in search results are remembered for the session, so opening one is instant.
 */

const remembered = new Map<string, FoodDetail>();

export function rememberFoods(foods: readonly FoodDetail[]): void {
  foods.forEach((food) => remembered.set(food.id, food));
}

/** Synchronous lookup: built-in foods and remembered packaged foods. */
export function peekFood(key: string): FoodDetail | null {
  if (key.startsWith('usda:')) return getUsdaFood(key.slice('usda:'.length));
  return remembered.get(key) ?? null;
}

export async function loadFood(key: string): Promise<FoodDetail | null> {
  const known = peekFood(key);
  if (known || !key.startsWith('off:')) return known;
  const food = await getOpenFoodFactsProduct(key.slice('off:'.length));
  if (food) rememberFoods([food]);
  return food;
}
