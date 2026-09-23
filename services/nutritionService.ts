import { MEAL_TYPES } from '@/constants/nutrition';
import { sumNutrition } from '@/lib/nutrition/calculateNutrition';
import type { MealItem, MealType, MealWithItems, NutritionValues } from '@/types';

export interface MealSection {
  mealType: MealType;
  items: MealItem[];
  totals: NutritionValues;
}

/**
 * Groups a day's meals into the four diary sections — always all four, in
 * fixed order, even when empty — with items in the order they were logged.
 */
export function buildMealSections(meals: readonly MealWithItems[]): MealSection[] {
  return MEAL_TYPES.map((mealType) => {
    const items = meals
      .filter((meal) => meal.mealType === mealType)
      .flatMap((meal) => meal.items)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { mealType, items, totals: sumNutrition(items) };
  });
}

export function calculateDailyTotals(sections: readonly MealSection[]): NutritionValues {
  return sumNutrition(sections.map((section) => section.totals));
}
