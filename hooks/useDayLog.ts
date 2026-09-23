import { useMemo } from 'react';

import { useDiary } from '@/contexts/DiaryContext';
import { buildMealSections, calculateDailyTotals } from '@/services/nutritionService';
import type { MealWithItems } from '@/types';
import { toDateKey } from '@/utils/date';

const NO_MEALS: MealWithItems[] = [];

/** Diary sections and totals for one local calendar day. */
export function useDayLog(date: Date) {
  const { mealsByDate } = useDiary();
  const meals = mealsByDate[toDateKey(date)] ?? NO_MEALS;
  const sections = useMemo(() => buildMealSections(meals), [meals]);
  const totals = useMemo(() => calculateDailyTotals(sections), [sections]);

  return { sections, totals };
}
