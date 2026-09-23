import type { AppIconName } from '@/constants/icons';
import type { MealType, NutritionValues } from '@/types';

/**
 * FDA Daily Values for a 2,000 kcal reference diet (21 CFR 101.9). Only used
 * until a user finishes onboarding and gets a personalized target.
 */
export const DEFAULT_GOALS: NutritionValues = {
  calories: 2000,
  protein: 50,
  carbs: 275,
  fat: 78,
};

export const MEAL_TYPES: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

export const MEAL_TYPE_META: Record<MealType, { label: string; icon: AppIconName }> = {
  breakfast: { label: 'Breakfast', icon: 'breakfast' },
  lunch: { label: 'Lunch', icon: 'lunch' },
  dinner: { label: 'Dinner', icon: 'dinner' },
  snacks: { label: 'Snacks', icon: 'snacks' },
};
