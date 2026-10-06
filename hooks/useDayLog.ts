import { useEffect, useMemo } from 'react';

import { useDiary } from '@/contexts/DiaryContext';
import { resolveMeals } from '@/lib/diary/resolve';
import { buildMealSections, calculateDailyTotals } from '@/services/nutritionService';
import type { MealRecord } from '@/types';
import { toDateKey } from '@/utils/date';
import { useCurrentTime } from './useCurrentTime';

const NO_MEALS: MealRecord[] = [];
/** After returning to the app, a day older than this is refreshed in case another device changed it. */
const STALE_AFTER_MS = 60_000;

/** Diary sections and totals for one local calendar day, loaded on first use. */
export function useDayLog(date: Date) {
  const { days, foods, foregroundCount, loadDay } = useDiary();
  const { now } = useCurrentTime();
  const dateKey = toDateKey(date);
  const day = days[dateKey];
  const needsLoad = day === undefined;
  const loadedAt = day?.loadedAt ?? null;

  useEffect(() => {
    if (needsLoad || (loadedAt !== null && Date.now() - loadedAt > STALE_AFTER_MS)) {
      void loadDay(dateKey);
    }
  }, [dateKey, needsLoad, loadedAt, foregroundCount, loadDay]);

  const meals = useMemo(() => resolveMeals(day?.meals ?? NO_MEALS, foods, now.getTime()), [day, foods, now]);
  const sections = useMemo(() => buildMealSections(meals), [meals]);
  const totals = useMemo(() => calculateDailyTotals(sections), [sections]);
  const items = sections.flatMap((section) => section.items);

  return {
    dateKey,
    sections,
    totals,
    status: day?.status ?? 'loading',
    refreshing: day?.refreshing ?? false,
    error: day?.error ?? null,
    foodsError: day?.foodsError ?? null,
    unresolvedCount: items.filter((item) => !item.resolved).length,
    hasFatSecretContent: items.some((item) => item.source === 'fatsecret' && item.resolved),
    refresh: () => loadDay(dateKey),
  };
}
