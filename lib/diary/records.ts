import { MEAL_TYPES } from '@/constants/nutrition';
import { portionNutrition, type StoredPortion } from '@/lib/nutrition/portion';
import type { AmountUnit, FoodDetail, FoodSource, MealItemRecord, MealRecord, NewMealItem } from '@/types';
import type { Tables, TablesUpdate } from '@/types/database';

/** Converts between database rows and the app's diary records. Pure, so it's unit-testable. */

const SOURCES: readonly FoodSource[] = ['usda', 'openfoodfacts', 'custom', 'ai_estimate'];
const AMOUNT_UNITS: readonly AmountUnit[] = ['serving', 'g', 'ml'];

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

const round = (value: number, decimals: number) => Math.round(value * 10 ** decimals) / 10 ** decimals;

export type MealRow = Tables<'meals'> & { meal_items: Tables<'meal_items'>[] };

export function mapMealItemRow(row: Tables<'meal_items'>): MealItemRecord | null {
  const source = oneOf(row.source, SOURCES);
  if (!source) return null;
  return {
    id: row.id,
    mealId: row.meal_id,
    source,
    externalFoodId: row.external_food_id,
    externalServingId: row.external_serving_id,
    servings: Number(row.servings),
    amountUnit: oneOf(row.amount_unit, AMOUNT_UNITS) ?? 'serving',
    isEstimate: row.is_estimate,
    foodName: row.food_name,
    brand: row.brand,
    grams: Number(row.grams),
    nutrition: { calories: Number(row.calories), protein: Number(row.protein), carbs: Number(row.carbs), fat: Number(row.fat) },
    createdAt: row.created_at,
  };
}

export function mapMealRow(row: MealRow): MealRecord | null {
  const mealType = oneOf(row.meal_type, MEAL_TYPES);
  if (!mealType) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    mealType,
    eatenAt: row.eaten_at,
    createdAt: row.created_at,
    items: row.meal_items.map(mapMealItemRow).filter((item): item is MealItemRecord => item !== null),
  };
}

/** One element of log_meal's p_items. */
export type MealItemPayload = {
  source: FoodSource;
  external_food_id: string | null;
  external_serving_id: string | null;
  servings: number;
  amount_unit: AmountUnit;
  is_estimate: boolean;
  food_name: string;
  brand: string | null;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export function toMealItemPayload(item: NewMealItem): MealItemPayload {
  return {
    source: item.source,
    external_food_id: item.externalFoodId ?? null,
    external_serving_id: item.externalServingId ?? null,
    servings: round(item.servings, 4),
    amount_unit: item.amountUnit,
    is_estimate: item.isEstimate ?? false,
    food_name: item.foodName.trim().slice(0, 200),
    brand: item.brand?.trim().slice(0, 120) || null,
    grams: round(item.grams, 1),
    calories: round(item.nutrition.calories, 1),
    protein: round(item.nutrition.protein, 1),
    carbs: round(item.nutrition.carbs, 1),
    fat: round(item.nutrition.fat, 1),
  };
}

/** A diary item for a food from the database, in the portion the user chose. Null if the portion doesn't fit. */
export function newItemFromFood(food: FoodDetail, portion: StoredPortion): NewMealItem | null {
  const serving = food.servings.find((candidate) => candidate.id === portion.servingId);
  if (!serving || !(portion.servings > 0)) return null;
  return {
    source: food.source,
    externalFoodId: food.externalId,
    externalServingId: serving.id,
    foodName: food.name,
    brand: food.brand,
    servings: portion.servings,
    amountUnit: portion.amountUnit,
    grams: (serving.metricAmount ?? 0) * portion.servings,
    nutrition: portionNutrition(serving, portion.servings),
  };
}

/** The row changes for a new portion of an existing entry: amount, grams, and recalculated nutrition. */
export function portionUpdate(food: FoodDetail, portion: StoredPortion): TablesUpdate<'meal_items'> | null {
  const serving = food.servings.find((candidate) => candidate.id === portion.servingId);
  if (!serving || !(portion.servings > 0)) return null;
  const nutrition = portionNutrition(serving, portion.servings);
  return {
    servings: round(portion.servings, 4),
    amount_unit: portion.amountUnit,
    // The synthetic "entry" serving (see storedEntryAsFood) isn't a real database serving.
    ...(serving.id === 'entry' ? {} : { external_serving_id: serving.id }),
    grams: round((serving.metricAmount ?? 0) * portion.servings, 1),
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
  };
}

/** The same food and amount as an existing entry, ready to log again (Duplicate). */
export function recordToNewItem(record: MealItemRecord): NewMealItem {
  return {
    source: record.source,
    externalFoodId: record.externalFoodId,
    externalServingId: record.externalServingId,
    foodName: record.foodName,
    brand: record.brand,
    servings: record.servings,
    amountUnit: record.amountUnit,
    grams: record.grams,
    nutrition: record.nutrition,
    isEstimate: record.isEstimate,
  };
}
