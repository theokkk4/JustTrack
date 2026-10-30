import { useMemo, useSyncExternalStore } from 'react';

import { sumNutrition } from '@/lib/nutrition/calculateNutrition';
import { buildMealSections } from '@/lib/log/entries';
import { entriesOnDay } from '@/lib/log/day';
import { logStore } from '@/lib/log/logStore';

/** One day of the log — today unless told otherwise — grouped by meal, with totals. */
export function useLog(day: Date) {
  const all = useSyncExternalStore(logStore.subscribe, logStore.getSnapshot, logStore.getSnapshot);
  const dayMs = day.getTime();
  const entries = useMemo(() => entriesOnDay(all, new Date(dayMs)), [all, dayMs]);
  const sections = useMemo(() => buildMealSections(entries), [entries]);
  const totals = useMemo(() => sumNutrition(entries), [entries]);
  return { entries, sections, totals, all };
}
