import type { FoodDetail, FoodServing, Meal, MealItem, MealItemRecord, MealRecord, MealWithItems } from '@/types';
import { formatQuantity } from '@/utils/quantity';

/** Turns stored diary records into what the UI shows. Pure: same records → same result. */

function servingCount(servings: number): string {
  return servings === 1 ? '1 serving' : `${formatQuantity(servings)} servings`;
}

export function amountLabel(record: Pick<MealItemRecord, 'amountUnit' | 'grams' | 'servings' | 'externalServingId'>): string {
  const grams = record.grams > 0 ? record.grams : null;
  if (record.amountUnit !== 'serving' && grams !== null) return `${formatQuantity(grams, 1)} ${record.amountUnit}`;
  // USDA portions are stored as "portion:1 cup", which reads better than "1 serving".
  const portion = record.externalServingId?.startsWith('portion:') ? record.externalServingId.slice('portion:'.length) : null;
  if (portion) return record.servings === 1 ? portion : `${formatQuantity(record.servings)} × ${portion}`;
  return `${servingCount(record.servings)}${grams !== null ? ` · ${formatQuantity(grams, 0)} g` : ''}`;
}

/** Any entry as a one-serving "food", so the portion editor can rescale it from its stored values. */
export function storedEntryAsFood(record: MealItemRecord): FoodDetail | null {
  if (!(record.servings > 0)) return null;
  const per = (value: number) => value / record.servings;
  const gramsPerServing = record.grams > 0 ? per(record.grams) : null;
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
  return {
    id: `entry:${record.id}`,
    source: record.source === 'openfoodfacts' ? 'openfoodfacts' : 'usda',
    externalId: record.externalFoodId ?? record.id,
    name: record.foodName,
    brand: record.brand,
    servings: [serving],
  };
}

export function resolveMealItem(record: MealItemRecord, meal: Meal): MealItem {
  return {
    id: record.id,
    mealId: meal.id,
    mealType: meal.mealType,
    eatenAt: meal.eatenAt,
    source: record.source,
    foodName: record.foodName,
    brand: record.brand,
    amountLabel: amountLabel(record),
    isEstimate: record.isEstimate,
    record,
    createdAt: record.createdAt,
    ...record.nutrition,
  };
}

export function resolveMeals(meals: readonly MealRecord[]): MealWithItems[] {
  return meals.map((meal) => ({ ...meal, items: meal.items.map((item) => resolveMealItem(item, meal)) }));
}
