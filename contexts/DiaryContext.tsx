import React, { createContext, useContext, useMemo, useState } from 'react';

import type { MealWithItems } from '@/types';

interface DiaryContextValue {
  /** Logged meals keyed by local date (YYYY-MM-DD). */
  mealsByDate: Readonly<Record<string, MealWithItems[]>>;
}

const DiaryContext = createContext<DiaryContextValue | null>(null);

export function DiaryProvider({ children }: { children: React.ReactNode }) {
  const [mealsByDate] = useState<Record<string, MealWithItems[]>>({});
  const value = useMemo<DiaryContextValue>(() => ({ mealsByDate }), [mealsByDate]);

  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
}

export function useDiary(): DiaryContextValue {
  const ctx = useContext(DiaryContext);
  if (!ctx) {
    throw new Error('useDiary must be used within a DiaryProvider');
  }
  return ctx;
}
