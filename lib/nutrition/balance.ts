import { macroShares } from '@/lib/log/entries';
import type { NutritionValues } from '@/types';

/**
 * A 0–100 "balance" score for a day's eating: how close the split of
 * calories between protein, carbs, and fat sits to the Acceptable
 * Macronutrient Distribution Ranges (protein 10–35%, carbs 45–65%,
 * fat 20–35%). It's a rough guide to balance, not a judgement of the food,
 * and never medical advice — the UI says so.
 */

/** Below this, there's not enough logged for the split to mean anything. */
export const MIN_CALORIES_FOR_SCORE = 300;

const RANGES = {
  protein: [0.1, 0.35],
  carbs: [0.45, 0.65],
  fat: [0.2, 0.35],
} as const;

/** 1 inside the range, falling to 0 once 20 percentage points outside it. */
function closeness(share: number, [low, high]: readonly [number, number]): number {
  const distance = share < low ? low - share : share > high ? share - high : 0;
  return Math.max(0, 1 - distance / 0.2);
}

export interface BalanceScore {
  score: number;
  /** Which macro is furthest outside its range, if any. */
  note: string | null;
}

export function balanceScore(nutrition: NutritionValues): BalanceScore | null {
  if (nutrition.calories < MIN_CALORIES_FOR_SCORE) return null;
  const shares = macroShares(nutrition);
  const parts = {
    protein: closeness(shares.protein, RANGES.protein),
    carbs: closeness(shares.carbs, RANGES.carbs),
    fat: closeness(shares.fat, RANGES.fat),
  };
  const score = Math.round(((parts.protein + parts.carbs + parts.fat) / 3) * 100);

  const weakest = (Object.keys(parts) as (keyof typeof parts)[]).sort((a, b) => parts[a] - parts[b])[0];
  let note: string | null = null;
  if (parts[weakest] < 1) {
    const [low, high] = RANGES[weakest];
    const share = shares[weakest];
    const label = { protein: 'Protein', carbs: 'Carbs', fat: 'Fat' }[weakest];
    note = share < low ? `${label} is on the low side today.` : share > high ? `${label} is on the high side today.` : null;
  }
  return { score, note };
}
