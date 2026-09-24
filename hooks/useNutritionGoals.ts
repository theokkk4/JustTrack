import { DEFAULT_GOALS } from '@/constants/nutrition';
import { useAuth } from '@/contexts/AuthContext';
import type { NutritionValues } from '@/types';

/** The user's daily targets, falling back to FDA reference values if none are saved yet. */
export function useNutritionGoals(): NutritionValues {
  const { goals } = useAuth();
  return goals ?? DEFAULT_GOALS;
}
