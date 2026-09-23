import { DEFAULT_GOALS } from '@/constants/nutrition';
import type { NutritionValues } from '@/types';

/** The active daily targets. Falls back to FDA reference values until the user sets personal goals. */
export function useNutritionGoals(): NutritionValues {
  return DEFAULT_GOALS;
}
