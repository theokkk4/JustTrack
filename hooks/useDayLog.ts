import { useEffect, useMemo } from 'react';

import { useDiary } from '@/contexts/DiaryContext';
import { resolveMeals } from '@/lib/diary/resolve';
import { buildMealSections, calculateDailyTotals } from '@/services/nutritionService';
import type { MealRecord } from '@/types';
import { toDateKey } from '@/utils/date';

const NO_MEALS: MealRecord[] = [];
/** After returning to the app, a day older than this is refreshed in case another device changed it. */
const STALE_AFTER_MS = 60_000;

/** Diary sections and totals for one local calendar day, loaded on first use. */
export function useDayLog(date: Date) {
  const { days, foregroundCount, loadDay } = useDiary();
  const dateKey = toDateKey(date);
  const day = days[dateKey];
  const needsLoad = day === undefined;
  const loadedAt = day?.loadedAt ?? null;

  useEffect(() => {
    if (needsLoad || (loadedAt !== null && Date.now() - loadedAt > STALE_AFTER_MS)) {
      void loadDay(dateKey);
    }
  }, [dateKey, needsLoad, loadedAt, foregroundCount, loadDay]);

  const meals = useMemo(() => resolveMeals(day?.meals ?? NO_MEALS), [day]);
  const sections = useMemo(() => buildMealSections(meals), [meals]);
  const totals = useMemo(() => calculateDailyTotals(sections), [sections]);

  return {
    dateKey,
    sections,
    totals,
    status: day?.status ?? 'loading',
    refreshing: day?.refreshing ?? false,
    error: day?.error ?? null,
    refresh: () => loadDay(dateKey),
  };
}
