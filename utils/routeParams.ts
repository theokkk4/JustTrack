import { MEAL_TYPES } from '@/constants/nutrition';
import type { MealType } from '@/types';
import { parseDateKey } from './date';

/** Route params can arrive as arrays (repeated keys) or not at all. */
export function singleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function mealTypeParam(value: string | string[] | undefined): MealType | null {
  const raw = singleParam(value);
  return raw && (MEAL_TYPES as readonly string[]).includes(raw) ? (raw as MealType) : null;
}

/** A YYYY-MM-DD date key, only if it names a real calendar day. */
export function dateKeyParam(value: string | string[] | undefined): string | null {
  const raw = singleParam(value);
  return raw && parseDateKey(raw) ? raw : null;
}
