import type { AmountUnit, FoodDetail, FoodServing, MetricUnit, NutritionValues } from '@/types';
import { formatQuantity } from '@/utils/quantity';
import { calculateNutritionForServings } from './calculateNutrition';

/**
 * Portions: how much of a food was eaten.
 *
 * The user picks either one of the food's servings ("1 cup") and a count, or
 * a metric unit and an amount ("150 g"). Either way it's stored the same way
 * — a serving ID plus a serving count — because that's all FatSecret's terms
 * let us keep. Gram amounts become a fraction of a metric serving.
 */

export type PortionChoice = { kind: 'serving'; servingId: string } | { kind: 'metric'; unit: MetricUnit };

export interface StoredPortion {
  servingId: string;
  servings: number;
  amountUnit: AmountUnit;
}

export const MAX_SERVINGS = 100;
export const MAX_METRIC_AMOUNT = 5000;

export function choiceKey(choice: PortionChoice): string {
  return choice.kind === 'serving' ? `serving:${choice.servingId}` : choice.unit;
}

function isHundredOf(serving: FoodServing, unit: MetricUnit): boolean {
  return new RegExp(`^100\\s*${unit}$`, 'i').test(serving.description.trim());
}

/** The serving that gram (or ml) amounts are measured against: "100 g" if there is one. */
export function metricServing(food: FoodDetail, unit: MetricUnit): FoodServing | null {
  const candidates = food.servings.filter((serving) => serving.metricUnit === unit && (serving.metricAmount ?? 0) > 0);
  return (
    candidates.find((serving) => isHundredOf(serving, unit)) ??
    candidates.find((serving) => serving.isDefault) ??
    candidates[0] ??
    null
  );
}

export function defaultServing(food: FoodDetail): FoodServing {
  return food.servings.find((serving) => serving.isDefault) ?? food.servings[0];
}

export interface PortionOption {
  choice: PortionChoice;
  label: string;
}

/** Every way this food can be measured: its servings (default first), then grams/ml when known. */
export function portionOptions(food: FoodDetail): PortionOption[] {
  const first = defaultServing(food);
  const servings = [first, ...food.servings.filter((serving) => serving !== first)];
  const options: PortionOption[] = servings.map((serving) => ({
    choice: { kind: 'serving', servingId: serving.id },
    label: serving.description,
  }));
  if (metricServing(food, 'g')) options.push({ choice: { kind: 'metric', unit: 'g' }, label: 'Grams (g)' });
  if (metricServing(food, 'ml')) options.push({ choice: { kind: 'metric', unit: 'ml' }, label: 'Milliliters (ml)' });
  return options;
}

/** A sensible starting amount for a choice: one serving, or one serving's worth of grams. */
export function defaultAmount(food: FoodDetail, choice: PortionChoice): number {
  if (choice.kind === 'serving') return 1;
  const base = defaultServing(food);
  if (base.metricUnit === choice.unit && base.metricAmount) return Math.round(base.metricAmount);
  return 100;
}

export function maxAmount(choice: PortionChoice): number {
  return choice.kind === 'serving' ? MAX_SERVINGS : MAX_METRIC_AMOUNT;
}

/** Converts what the user entered into what gets stored. Null if the choice doesn't fit this food. */
export function toStoredPortion(food: FoodDetail, choice: PortionChoice, amount: number): StoredPortion | null {
  if (!(amount > 0)) return null;
  if (choice.kind === 'serving') {
    return food.servings.some((serving) => serving.id === choice.servingId)
      ? { servingId: choice.servingId, servings: amount, amountUnit: 'serving' }
      : null;
  }
  const base = metricServing(food, choice.unit);
  if (!base?.metricAmount) return null;
  return { servingId: base.id, servings: amount / base.metricAmount, amountUnit: choice.unit };
}

/** Converts a stored portion back into editor terms, falling back to servings if units no longer line up. */
export function fromStoredPortion(food: FoodDetail, stored: StoredPortion): { choice: PortionChoice; amount: number } {
  const serving = food.servings.find((candidate) => candidate.id === stored.servingId);
  if (!serving) {
    const fallback = defaultServing(food);
    return { choice: { kind: 'serving', servingId: fallback.id }, amount: 1 };
  }
  if (stored.amountUnit !== 'serving' && serving.metricUnit === stored.amountUnit && serving.metricAmount) {
    // Servings are stored to 4 decimals, so round away the drift: 0.7059 × 42.5 g reads back as 30 g.
    const amount = Math.round(stored.servings * serving.metricAmount * 10) / 10;
    return { choice: { kind: 'metric', unit: stored.amountUnit }, amount };
  }
  return { choice: { kind: 'serving', servingId: serving.id }, amount: stored.servings };
}

/** Nutrition for a count of one serving — the one place a portion becomes calories. */
export function portionNutrition(serving: FoodServing, servings: number): NutritionValues {
  return calculateNutritionForServings(serving, servings);
}

/** Grams (or ml) in a portion, when the serving's metric size is known. */
export function portionMetricAmount(serving: FoodServing, servings: number): number | null {
  return serving.metricAmount ? serving.metricAmount * servings : null;
}

/** "150 g", "1 cup", or "1.5 × 1 cup". */
export function describePortion(serving: FoodServing, servings: number, amountUnit: AmountUnit): string {
  if (amountUnit !== 'serving' && serving.metricUnit === amountUnit && serving.metricAmount) {
    return `${formatQuantity(serving.metricAmount * servings, 1)} ${amountUnit}`;
  }
  return servings === 1 ? serving.description : `${formatQuantity(servings)} × ${serving.description}`;
}
