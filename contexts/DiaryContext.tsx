import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { missingFoodIds } from '@/lib/diary/resolve';
import { clearFoodCache, getFoodSnapshot, pruneFoodCache, subscribeToFoodCache, type FoodSnapshot } from '@/lib/food/foodCache';
import type { StoredPortion } from '@/lib/nutrition/portion';
import { fetchFoods } from '@/services/foodService';
import * as mealService from '@/services/mealService';
import type { FoodDetail, MealItem, MealRecord, MealType, NewMealItem } from '@/types';
import { dayRange, parseDateKey, toDateKey } from '@/utils/date';
import { getErrorMessage } from '@/utils/errors';
import { eatenAtFor } from '@/utils/mealTime';

export interface DayState {
  /** "loading" only until the first successful load; later refreshes keep showing the last data. */
  status: 'loading' | 'ready' | 'error';
  refreshing: boolean;
  meals: MealRecord[];
  /** The diary itself couldn't load (or refresh). */
  error: string | null;
  /** FatSecret names/nutrition couldn't load, so some entries show as unavailable. */
  foodsError: string | null;
  loadedAt: number | null;
}

interface DiaryContextValue {
  days: Readonly<Record<string, DayState>>;
  foods: FoodSnapshot;
  /** Bumps each time the app returns to the foreground, so visible days can refresh. */
  foregroundCount: number;
  loadDay: (dateKey: string) => Promise<void>;
  logFood: (input: { dateKey: string; mealType: MealType; item: NewMealItem }) => Promise<void>;
  updatePortion: (entry: MealItem, food: FoodDetail, portion: StoredPortion) => Promise<void>;
  moveEntry: (entry: MealItem, mealType: MealType) => Promise<void>;
  duplicateEntry: (entry: MealItem, target?: { dateKey: string; mealType: MealType }) => Promise<void>;
  deleteEntry: (entry: MealItem) => Promise<void>;
}

const DiaryContext = createContext<DiaryContextValue | null>(null);
const NO_DAYS: Record<string, DayState> = {};

function emptyDay(): DayState {
  return { status: 'loading', refreshing: true, meals: [], error: null, foodsError: null, loadedAt: null };
}

export function entryDateKey(entry: Pick<MealItem, 'eatenAt'>): string {
  return toDateKey(new Date(entry.eatenAt));
}

export function DiaryProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  // Days belong to one user; switching accounts starts from nothing. Resetting
  // during render (not in an effect) means no stale day is ever shown, and
  // late responses for the previous user are dropped by updateDay below.
  const [store, setStore] = useState<{ userId: string | null; days: Record<string, DayState> }>({ userId, days: {} });
  if (store.userId !== userId) {
    setStore({ userId, days: {} });
  }
  const days = store.userId === userId ? store.days : NO_DAYS;

  // Every load gets a ticket per user+day; only the newest may write its result.
  const tickets = useRef(new Map<string, number>());

  useEffect(() => {
    if (!userId) clearFoodCache();
  }, [userId]);

  const foods = useSyncExternalStore(subscribeToFoodCache, getFoodSnapshot, getFoodSnapshot);

  const [foregroundCount, setForegroundCount] = useState(0);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      pruneFoodCache();
      setForegroundCount((count) => count + 1);
    });
    return () => subscription.remove();
  }, []);

  const updateDay = useCallback((forUser: string, dateKey: string, update: (day: DayState) => DayState) => {
    setStore((previous) =>
      previous.userId === forUser
        ? { userId: forUser, days: { ...previous.days, [dateKey]: update(previous.days[dateKey] ?? emptyDay()) } }
        : previous
    );
  }, []);

  const resolveFoods = useCallback(
    async (forUser: string, dateKey: string, meals: MealRecord[]) => {
      const ids = missingFoodIds(meals, getFoodSnapshot(), Date.now());
      if (ids.length === 0) {
        updateDay(forUser, dateKey, (day) => ({ ...day, foodsError: null }));
        return;
      }
      try {
        await fetchFoods(ids);
        updateDay(forUser, dateKey, (day) => ({ ...day, foodsError: null }));
      } catch (error) {
        updateDay(forUser, dateKey, (day) => ({ ...day, foodsError: getErrorMessage(error) }));
      }
    },
    [updateDay]
  );

  const loadDay = useCallback(
    async (dateKey: string) => {
      const date = parseDateKey(dateKey);
      if (!userId || !date) return;
      const ticketKey = `${userId}:${dateKey}`;
      const ticket = (tickets.current.get(ticketKey) ?? 0) + 1;
      tickets.current.set(ticketKey, ticket);
      const isLatest = () => tickets.current.get(ticketKey) === ticket;

      updateDay(userId, dateKey, (day) => ({ ...day, refreshing: true }));
      try {
        const { start, end } = dayRange(date);
        const meals = await mealService.fetchMeals(userId, start, end);
        if (!isLatest()) return;
        updateDay(userId, dateKey, (day) => ({ ...day, status: 'ready', refreshing: false, meals, error: null, loadedAt: Date.now() }));
        await resolveFoods(userId, dateKey, meals);
      } catch (error) {
        if (!isLatest()) return;
        updateDay(userId, dateKey, (day) => ({
          ...day,
          status: day.loadedAt === null ? 'error' : 'ready',
          refreshing: false,
          error: getErrorMessage(error),
        }));
      }
    },
    [userId, updateDay, resolveFoods]
  );

  const logFood = useCallback<DiaryContextValue['logFood']>(
    async ({ dateKey, mealType, item }) => {
      await mealService.logMeal({ mealType, eatenAt: eatenAtFor(dateKey, mealType, new Date()), items: [item] });
      await loadDay(dateKey);
    },
    [loadDay]
  );

  const updatePortion = useCallback<DiaryContextValue['updatePortion']>(
    async (entry, food, portion) => {
      await mealService.updateMealItemPortion(entry.record, food, portion);
      await loadDay(entryDateKey(entry));
    },
    [loadDay]
  );

  const moveEntry = useCallback<DiaryContextValue['moveEntry']>(
    async (entry, mealType) => {
      if (entry.mealType === mealType) return;
      await mealService.moveMealItem(entry.id, mealType);
      await loadDay(entryDateKey(entry));
    },
    [loadDay]
  );

  const duplicateEntry = useCallback<DiaryContextValue['duplicateEntry']>(
    async (entry, target) => {
      const dateKey = target?.dateKey ?? entryDateKey(entry);
      const mealType = target?.mealType ?? entry.mealType;
      const eatenAt = dateKey === entryDateKey(entry) ? new Date(entry.eatenAt) : eatenAtFor(dateKey, mealType, new Date());
      await mealService.duplicateMealItem(entry.record, mealType, eatenAt);
      await loadDay(dateKey);
    },
    [loadDay]
  );

  const deleteEntry = useCallback<DiaryContextValue['deleteEntry']>(
    async (entry) => {
      if (!userId) return;
      const dateKey = entryDateKey(entry);
      // Optimistic: the row disappears immediately and comes back if the delete fails.
      updateDay(userId, dateKey, (day) => ({
        ...day,
        meals: day.meals.map((meal) => ({ ...meal, items: meal.items.filter((item) => item.id !== entry.id) })),
      }));
      try {
        await mealService.deleteMealItem(entry.id);
      } catch (error) {
        void loadDay(dateKey);
        throw error;
      }
    },
    [userId, updateDay, loadDay]
  );

  const value = useMemo<DiaryContextValue>(
    () => ({ days, foods, foregroundCount, loadDay, logFood, updatePortion, moveEntry, duplicateEntry, deleteEntry }),
    [days, foods, foregroundCount, loadDay, logFood, updatePortion, moveEntry, duplicateEntry, deleteEntry]
  );

  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
}

export function useDiary(): DiaryContextValue {
  const ctx = useContext(DiaryContext);
  if (!ctx) {
    throw new Error('useDiary must be used within a DiaryProvider');
  }
  return ctx;
}
