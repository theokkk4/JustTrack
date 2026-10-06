import { MEAL_TYPES } from '@/constants/nutrition';
import { portionNutrition, type StoredPortion } from '@/lib/nutrition/portion';
import type { AmountUnit, FoodDetail, FoodSource, MealItemRecord, MealRecord, NewMealItem } from '@/types';
import type { Tables, TablesUpdate } from '@/types/database';

/**
 * Converts between database rows and the app's diary records. Pure, so the
 * rules (like "FatSecret rows only ever carry IDs") are unit-testable.
 */

const SOURCES: readonly FoodSource[] = ['fatsecret', 'openfoodfacts', 'custom', 'ai_estimate'];
const AMOUNT_UNITS: readonly AmountUnit[] = ['serving', 'g', 'ml'];

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

export type MealRow = Tables<'meals'> & { meal_items: Tables<'meal_items'>[] };

export function mapMealItemRow(row: Tables<'meal_items'>): MealItemRecord | null {
  const source = oneOf(row.source, SOURCES);
  if (!source) return null;
  const hasNutrition = row.calories !== null && row.protein !== null && row.carbs !== null && row.fat !== null;
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
    grams: row.grams === null ? null : Number(row.grams),
    nutrition: hasNutrition
      ? { calories: Number(row.calories), protein: Number(row.protein), carbs: Number(row.carbs), fat: Number(row.fat) }
      : null,
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

/** One element of log_meal's p_items. FatSecret items send nothing but IDs and the amount. */
export type MealItemPayload = {
  source: FoodSource;
  external_food_id: string | null;
  external_serving_id: string | null;
  servings: number;
  amount_unit: AmountUnit;
  is_estimate: boolean;
  food_name: string | null;
  brand: string | null;
  grams: number | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

const round = (value: number, decimals: number) => Math.round(value * 10 ** decimals) / 10 ** decimals;

export function toMealItemPayload(item: NewMealItem): MealItemPayload {
  const shared = {
    servings: round(item.servings, 4),
    amount_unit: item.amountUnit,
    is_estimate: item.isEstimate ?? false,
  };
  if (item.source === 'fatsecret') {
    return {
      ...shared,
      source: 'fatsecret',
      external_food_id: item.externalFoodId,
      external_serving_id: item.externalServingId,
      food_name: null,
      brand: null,
      grams: null,
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
    };
  }
  return {
    ...shared,
    source: item.source,
    external_food_id: item.externalFoodId ?? null,
    external_serving_id: null,
    food_name: item.foodName.trim().slice(0, 200),
    brand: item.brand?.trim().slice(0, 120) || null,
    grams: round(item.grams, 1),
    calories: round(item.nutrition.calories, 1),
    protein: round(item.nutrition.protein, 1),
    carbs: round(item.nutrition.carbs, 1),
    fat: round(item.nutrition.fat, 1),
  };
}

/**
 * The row changes for a new portion of an existing entry. FatSecret rows
 * only ever change their serving ID and count; stored-content rows get
 * their grams and nutrition recalculated from the per-serving values.
 */
export function portionUpdate(
  record: MealItemRecord,
  food: FoodDetail,
  portion: StoredPortion
): TablesUpdate<'meal_items'> | null {
  const serving = food.servings.find((candidate) => candidate.id === portion.servingId);
  if (!serving || !(portion.servings > 0)) return null;
  const shared = { servings: round(portion.servings, 4), amount_unit: portion.amountUnit };
  if (record.source === 'fatsecret') {
    return { ...shared, external_serving_id: portion.servingId };
  }
  const nutrition = portionNutrition(serving, portion.servings);
  return {
    ...shared,
    grams: round((serving.metricAmount ?? 0) * portion.servings, 1),
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
  };
}

/** The same food and amount as an existing entry, ready to log again (Duplicate). */
export function recordToNewItem(record: MealItemRecord): NewMealItem | null {
  const shared = { servings: record.servings, amountUnit: record.amountUnit, isEstimate: record.isEstimate };
  if (record.source === 'fatsecret') {
    if (!record.externalFoodId || !record.externalServingId) return null;
    return { ...shared, source: 'fatsecret', externalFoodId: record.externalFoodId, externalServingId: record.externalServingId };
  }
  if (!record.foodName || record.grams === null || !record.nutrition) return null;
  return {
    ...shared,
    source: record.source,
    externalFoodId: record.externalFoodId,
    foodName: record.foodName,
    brand: record.brand,
    grams: record.grams,
    nutrition: record.nutrition,
  };
}
