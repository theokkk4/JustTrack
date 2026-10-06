import type { MealType } from '@/types';
import { parseDateKey, toDateKey } from './date';

/** The meal someone is most likely logging right now, by local time of day. */
export function defaultMealType(now: Date): MealType {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes >= 4 * 60 && minutes < 10 * 60 + 30) return 'breakfast';
  if (minutes >= 10 * 60 + 30 && minutes < 14 * 60 + 30) return 'lunch';
  if (minutes >= 17 * 60 && minutes < 21 * 60 + 30) return 'dinner';
  return 'snacks';
}

/** Representative local times for logging to a day other than today. */
const MEAL_TIMES: Record<MealType, [hours: number, minutes: number]> = {
  breakfast: [8, 0],
  lunch: [12, 30],
  snacks: [15, 30],
  dinner: [18, 30],
};

/**
 * When a new entry was eaten: right now when logging to today, otherwise a
 * sensible time for that meal on the chosen day (so it lands on that day).
 */
export function eatenAtFor(dateKey: string, mealType: MealType, now: Date): Date {
  if (dateKey === toDateKey(now)) return now;
  const day = parseDateKey(dateKey) ?? now;
  const [hours, minutes] = MEAL_TIMES[mealType];
  const eatenAt = new Date(day);
  eatenAt.setHours(hours, minutes, 0, 0);
  return eatenAt;
}
