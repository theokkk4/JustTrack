import { MEAL_TYPES } from '@/constants/nutrition';
import { sumNutrition } from '@/lib/nutrition/calculateNutrition';
import { portionNutrition, type StoredPortion } from '@/lib/nutrition/portion';
import type { EstimatedFood, FoodDetail, FoodServing, LogEntry, MealType, NewLogEntry, NutritionValues } from '@/types';
import { formatQuantity } from '@/utils/quantity';

/** Pure helpers for creating, reshaping, and summarizing log entries. */

const round = (value: number, decimals: number) => Math.round(value * 10 ** decimals) / 10 ** decimals;

export function newEntryId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEntry(input: NewLogEntry, now: Date): LogEntry {
  return { ...input, id: newEntryId(), loggedAt: now.toISOString() };
}

/** An entry for a database food in the portion the user chose. Null if the portion doesn't fit the food. */
export function entryFromFood(food: FoodDetail, portion: StoredPortion, mealType: MealType): NewLogEntry | null {
  const serving = food.servings.find((candidate) => candidate.id === portion.servingId);
  if (!serving || !(portion.servings > 0)) return null;
  const nutrition = portionNutrition(serving, portion.servings);
  return {
    mealType,
    source: food.source,
    externalFoodId: food.externalId,
    externalServingId: serving.id,
    foodName: food.name,
    brand: food.brand,
    servings: round(portion.servings, 4),
    amountUnit: portion.amountUnit,
    grams: round((serving.metricAmount ?? 0) * portion.servings, 1),
    isEstimate: false,
    imageUri: food.imageUrl ?? null,
    ...nutrition,
  };
}

/** An entry for something the photo scanner identified, as reviewed by the user. */
export function entryFromEstimate(food: EstimatedFood, mealType: MealType): NewLogEntry {
  return {
    mealType,
    source: 'ai_estimate',
    externalFoodId: null,
    externalServingId: null,
    foodName: food.name,
    brand: null,
    servings: 1,
    amountUnit: 'g',
    grams: round(food.estimatedGrams, 1),
    isEstimate: true,
    imageUri: null,
    calories: round(food.calories, 1),
    protein: round(food.protein, 1),
    carbs: round(food.carbs, 1),
    fat: round(food.fat, 1),
  };
}

/** The same entry in a new portion of the same food, nutrition recalculated. */
export function rescaleEntry(entry: LogEntry, food: FoodDetail, portion: StoredPortion): LogEntry | null {
  const serving = food.servings.find((candidate) => candidate.id === portion.servingId);
  if (!serving || !(portion.servings > 0)) return null;
  return {
    ...entry,
    // The synthetic "entry" serving (see entryAsFood) isn't a real database serving.
    externalServingId: serving.id === 'entry' ? entry.externalServingId : serving.id,
    servings: round(portion.servings, 4),
    amountUnit: portion.amountUnit,
    grams: round((serving.metricAmount ?? 0) * portion.servings, 1),
    ...portionNutrition(serving, portion.servings),
  };
}

function servingCount(servings: number): string {
  return servings === 1 ? '1 serving' : `${formatQuantity(servings)} servings`;
}

/** "150 g", "1 cup", "1.5 × 1 cup", or "2 servings · 120 g". */
export function amountLabel(entry: Pick<LogEntry, 'amountUnit' | 'grams' | 'servings' | 'externalServingId'>): string {
  const grams = entry.grams > 0 ? entry.grams : null;
  if (entry.amountUnit !== 'serving' && grams !== null) return `${formatQuantity(grams, 1)} ${entry.amountUnit}`;
  // USDA portions are stored as "portion:1 cup", which reads better than "1 serving".
  const portion = entry.externalServingId?.startsWith('portion:') ? entry.externalServingId.slice('portion:'.length) : null;
  if (portion) return entry.servings === 1 ? portion : `${formatQuantity(entry.servings)} × ${portion}`;
  return `${servingCount(entry.servings)}${grams !== null ? ` · ${formatQuantity(grams, 0)} g` : ''}`;
}

/** Any entry as a one-serving "food", so the portion editor can rescale it from its own values. */
export function entryAsFood(entry: LogEntry): FoodDetail | null {
  if (!(entry.servings > 0)) return null;
  const per = (value: number) => value / entry.servings;
  const gramsPerServing = entry.grams > 0 ? per(entry.grams) : null;
  const serving: FoodServing = {
    id: 'entry',
    description: gramsPerServing ? `1 serving (${formatQuantity(gramsPerServing, 1)} g)` : '1 serving',
    metricAmount: gramsPerServing,
    metricUnit: gramsPerServing ? 'g' : null,
    calories: per(entry.calories),
    protein: per(entry.protein),
    carbs: per(entry.carbs),
    fat: per(entry.fat),
    isDefault: true,
  };
  return {
    id: `entry:${entry.id}`,
    source: entry.source === 'openfoodfacts' || entry.source === 'chain' ? entry.source : 'usda',
    externalId: entry.externalFoodId ?? entry.id,
    name: entry.foodName,
    brand: entry.brand,
    imageUrl: entry.imageUri,
    servings: [serving],
  };
}

export interface MealSection {
  mealType: MealType;
  entries: LogEntry[];
  totals: NutritionValues;
}

/** The four meals, always in order, each with its entries (oldest first) and totals. */
export function buildMealSections(entries: readonly LogEntry[]): MealSection[] {
  return MEAL_TYPES.map((mealType) => {
    const items = entries.filter((entry) => entry.mealType === mealType).sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
    return { mealType, entries: items, totals: sumNutrition(items) };
  });
}

export interface MacroShares {
  protein: number;
  carbs: number;
  fat: number;
}

/** Each macro's share of the calories it accounts for (4/4/9 kcal per gram), summing to 1 — or all zero. */
export function macroShares(nutrition: NutritionValues): MacroShares {
  const protein = nutrition.protein * 4;
  const carbs = nutrition.carbs * 4;
  const fat = nutrition.fat * 9;
  const total = protein + carbs + fat;
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 };
  return { protein: protein / total, carbs: carbs / total, fat: fat / total };
}
