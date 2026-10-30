import type { FoodDetail } from '@/types';

/**
 * Packaged-food search returns the same product many times over: one entry
 * per barcode, per country, per pack size, often with the name typed
 * slightly differently. Two results are the same food when the name, brand,
 * and nutrition per 100 g match, and only the most complete one is kept.
 */

const fold = (value: string | null | undefined) =>
  (value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

function per100(food: FoodDetail): string {
  const metric = food.servings.find((serving) => serving.metricAmount === 100) ?? food.servings.find((serving) => serving.metricAmount);
  if (!metric?.metricAmount) return 'none';
  const scale = 100 / metric.metricAmount;
  // Nutrition values are quantized so rounding differences between entries don't split a product.
  const q = (value: number, step: number) => Math.round((value * scale) / step) * step;
  return [q(metric.calories, 5), q(metric.protein, 1), q(metric.carbs, 2), q(metric.fat, 1)].join('/');
}

/** The identity of a food for the purpose of hiding duplicates. */
export function duplicateKey(food: FoodDetail): string {
  return `${food.source}|${fold(food.name)}|${fold(food.brand)}|${per100(food)}`;
}

/** How much a result has to show: a photo, a labeled serving, a name that says more than the brand. */
export function completeness(food: FoodDetail): number {
  let score = 0;
  if (food.imageUrl) score += 2;
  if (food.servings.some((serving) => serving.id === 'serving')) score += 1;
  if (food.detail) score += 1;
  if (food.brand && fold(food.name) !== fold(food.brand)) score += 1;
  return score;
}

/** Collapses duplicates, keeping the most complete entry and the first-seen order. */
export function dedupeFoods(foods: readonly FoodDetail[]): FoodDetail[] {
  const best = new Map<string, FoodDetail>();
  const order: string[] = [];
  for (const food of foods) {
    const key = duplicateKey(food);
    const current = best.get(key);
    if (!current) {
      best.set(key, food);
      order.push(key);
    } else if (completeness(food) > completeness(current)) {
      best.set(key, food);
    }
  }
  return order.map((key) => best.get(key) as FoodDetail);
}

/** Puts results that have something to show (a photo, a serving) ahead of bare ones, keeping relevance order otherwise. */
export function sortByCompleteness(foods: readonly FoodDetail[]): FoodDetail[] {
  return foods.map((food, index) => ({ food, index, score: Math.min(completeness(food), 3) })).sort((a, b) => b.score - a.score || a.index - b.index).map((item) => item.food);
}
