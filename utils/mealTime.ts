import type { MealType } from '@/types';

/** The meal someone is most likely logging right now, by local time of day. */
export function defaultMealType(now: Date): MealType {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes >= 4 * 60 && minutes < 10 * 60 + 30) return 'breakfast';
  if (minutes >= 10 * 60 + 30 && minutes < 14 * 60 + 30) return 'lunch';
  if (minutes >= 17 * 60 && minutes < 21 * 60 + 30) return 'dinner';
  return 'snacks';
}
