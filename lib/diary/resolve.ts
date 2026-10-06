import { isFresh, type FoodSnapshot } from '@/lib/food/foodCache';
import { describePortion, portionNutrition } from '@/lib/nutrition/portion';
import type { CachedFood, FoodDetail, FoodServing, Meal, MealItem, MealItemRecord, MealRecord, MealWithItems, NutritionValues } from '@/types';
import { formatQuantity } from '@/utils/quantity';

/**
 * Turns stored diary records into what the UI shows. FatSecret rows are
 * looked up in the (under-24h) food snapshot; every other row carries its
 * own content. Pure: same records + foods + time → same result.
 */

const ZERO: NutritionValues = { calories: 0, protein: 0, carbs: 0, fat: 0 };

function servingCount(servings: number): string {
  return servings === 1 ? '1 serving' : `${formatQuantity(servings)} servings`;
}

/** Stored-content entries (custom, Open Food Facts, AI estimates) as a one-serving "food" for the portion editor. */
export function storedEntryAsFood(record: MealItemRecord): FoodDetail | null {
  if (!record.foodName || !record.nutrition || !(record.servings > 0)) return null;
  const per = (value: number) => value / record.servings;
  const gramsPerServing = record.grams !== null && record.grams > 0 ? per(record.grams) : null;
  const serving: FoodServing = {
    id: 'entry',
    description: gramsPerServing ? `1 serving (${formatQuantity(gramsPerServing, 1)} g)` : '1 serving',
    metricAmount: gramsPerServing,
    metricUnit: gramsPerServing ? 'g' : null,
    calories: per(record.nutrition.calories),
    protein: per(record.nutrition.protein),
    carbs: per(record.nutrition.carbs),
    fat: per(record.nutrition.fat),
    isDefault: true,
  };
  return { id: record.id, name: record.foodName, brand: record.brand, type: 'generic', servings: [serving] };
}

function freshFood(foods: FoodSnapshot, id: string | null, now: number): CachedFood | undefined {
  const food = id ? foods.get(id) : undefined;
  return food && isFresh(food, now) ? food : undefined;
}

export function resolveMealItem(record: MealItemRecord, meal: Meal, foods: FoodSnapshot, now: number): MealItem {
  const base = {
    id: record.id,
    mealId: meal.id,
    mealType: meal.mealType,
    eatenAt: meal.eatenAt,
    source: record.source,
    isEstimate: record.isEstimate,
    record,
    createdAt: record.createdAt,
  };

  if (record.source === 'fatsecret') {
    const food = freshFood(foods, record.externalFoodId, now);
    const serving = food?.servings.find((candidate) => candidate.id === record.externalServingId);
    if (food && serving) {
      return {
        ...base,
        ...portionNutrition(serving, record.servings),
        foodName: food.name,
        brand: food.brand,
        amountLabel: describePortion(serving, record.servings, record.amountUnit),
        resolved: true,
      };
    }
    return {
      ...base,
      ...ZERO,
      foodName: food?.name ?? 'Food details unavailable',
      brand: food?.brand ?? null,
      amountLabel: servingCount(record.servings),
      resolved: false,
    };
  }

  const grams = record.grams !== null && record.grams > 0 ? record.grams : null;
  return {
    ...base,
    ...(record.nutrition ?? ZERO),
    foodName: record.foodName ?? 'Unnamed food',
    brand: record.brand,
    amountLabel:
      record.amountUnit !== 'serving' && grams !== null
        ? `${formatQuantity(grams, 1)} ${record.amountUnit}`
        : `${servingCount(record.servings)}${grams !== null ? ` · ${formatQuantity(grams, 0)} g` : ''}`,
    resolved: record.nutrition !== null,
  };
}

export function resolveMeals(meals: readonly MealRecord[], foods: FoodSnapshot, now: number): MealWithItems[] {
  return meals.map((meal) => ({ ...meal, items: meal.items.map((item) => resolveMealItem(item, meal, foods, now)) }));
}

/** FatSecret food IDs in these meals that aren't in the snapshot (or have gone stale). */
export function missingFoodIds(meals: readonly MealRecord[], foods: FoodSnapshot, now: number): string[] {
  const ids = new Set<string>();
  for (const meal of meals) {
    for (const item of meal.items) {
      if (item.source === 'fatsecret' && item.externalFoodId && !freshFood(foods, item.externalFoodId, now)) {
        ids.add(item.externalFoodId);
      }
    }
  }
  return [...ids];
}
