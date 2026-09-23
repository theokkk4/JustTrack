import type { NutritionBasis, NutritionValues } from '@/types';

/**
 * Single source of truth for turning a food's reference nutrition into the
 * values for however much of it was actually eaten. Every screen that shows
 * or logs nutrition should go through these functions rather than
 * recomputing ratios inline.
 */

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Scale a food's nutrition (measured at `basis.referenceGrams`) to `targetGrams`.
 * Use this for FatSecret/custom foods, which always carry a reference weight.
 */
export function calculateNutrition(basis: NutritionBasis, targetGrams: number): NutritionValues {
  if (basis.referenceGrams <= 0) {
    throw new Error('NutritionBasis.referenceGrams must be greater than 0');
  }
  if (targetGrams < 0) {
    throw new Error('targetGrams must be >= 0');
  }

  const ratio = targetGrams / basis.referenceGrams;
  return {
    calories: round1(basis.calories * ratio),
    protein: round1(basis.protein * ratio),
    carbs: round1(basis.carbs * ratio),
    fat: round1(basis.fat * ratio),
  };
}

/** Scale per-serving nutrition by a serving count (e.g. 1.5 servings of a granola bar). */
export function calculateNutritionForServings(perServing: NutritionValues, servings: number): NutritionValues {
  if (servings < 0) {
    throw new Error('servings must be >= 0');
  }
  return {
    calories: round1(perServing.calories * servings),
    protein: round1(perServing.protein * servings),
    carbs: round1(perServing.carbs * servings),
    fat: round1(perServing.fat * servings),
  };
}

export function sumNutrition(items: readonly NutritionValues[]): NutritionValues {
  return items.reduce<NutritionValues>(
    (total, item) => ({
      calories: round1(total.calories + item.calories),
      protein: round1(total.protein + item.protein),
      carbs: round1(total.carbs + item.carbs),
      fat: round1(total.fat + item.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function calculateRemaining(goal: number, consumed: number): number {
  return Math.round(goal - consumed);
}

/** Progress toward a goal, clamped to [0, 1] for use in progress bars/rings. */
export function calculateProgress(consumed: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(Math.max(consumed / goal, 0), 1);
}

/** Atwater general factors — used only to sanity-check AI/estimated macro breakdowns, never to override a measured calorie value. */
export function estimateCaloriesFromMacros(macros: Pick<NutritionValues, 'protein' | 'carbs' | 'fat'>): number {
  return Math.round(macros.protein * 4 + macros.carbs * 4 + macros.fat * 9);
}
