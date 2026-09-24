import type { ActivityLevel, NutritionValues, Sex, WeightGoal } from '@/types';

/**
 * Initial calorie/macro targets from onboarding answers. These are
 * population-level estimates — the UI must always present them as such and
 * let the user adjust them.
 */

export interface BodyStats {
  sex: Sex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
}

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** ~500 kcal/day ≈ 0.45 kg (1 lb) per week; +300 is a lean surplus. */
const GOAL_ADJUSTMENT: Record<WeightGoal, number> = { lose: -500, maintain: 0, gain: 300 };

/** Floor for any recommended target, however the inputs work out. */
export const MIN_CALORIE_TARGET = 1200;

/** "unspecified" uses the midpoint of the male and female constants. */
const MIFFLIN_SEX_CONSTANT: Record<Sex, number> = { male: 5, female: -161, unspecified: -78 };

/** Mifflin–St Jeor resting energy expenditure, in kcal/day. */
export function calculateBMR({ sex, ageYears, heightCm, weightKg }: BodyStats): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + MIFFLIN_SEX_CONSTANT[sex];
}

export function calculateTDEE(stats: BodyStats, activity: ActivityLevel): number {
  return calculateBMR(stats) * ACTIVITY_MULTIPLIERS[activity];
}

export function calculateCalorieTarget(stats: BodyStats, activity: ActivityLevel, goal: WeightGoal): number {
  const target = calculateTDEE(stats, activity) + GOAL_ADJUSTMENT[goal];
  return Math.max(MIN_CALORIE_TARGET, Math.round(target / 10) * 10);
}

/**
 * Protein scales with bodyweight (1.6 g/kg when changing weight to protect
 * lean mass, 1.4 g/kg to maintain), capped at 35% of calories. Fat is 30% of
 * calories, inside the 20–35% acceptable range. Carbs fill the remainder.
 */
export function calculateMacroTargets(
  calories: number,
  weightKg: number,
  goal: WeightGoal
): Pick<NutritionValues, 'protein' | 'carbs' | 'fat'> {
  const proteinPerKg = goal === 'maintain' ? 1.4 : 1.6;
  const protein = Math.round(Math.min(weightKg * proteinPerKg, (calories * 0.35) / 4));
  const fat = Math.round((calories * 0.3) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { protein, carbs, fat };
}

export function calculateNutritionTargets(stats: BodyStats, activity: ActivityLevel, goal: WeightGoal): NutritionValues {
  const calories = calculateCalorieTarget(stats, activity, goal);
  return { calories, ...calculateMacroTargets(calories, stats.weightKg, goal) };
}

export function ageFromBirthYear(birthYear: number, now: Date = new Date()): number {
  return now.getFullYear() - birthYear;
}
