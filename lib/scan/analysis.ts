import type { EstimatedFood, MealAnalysis } from '@/types';

/** Validates what the analyze-meal endpoint returns, so a bad response never crashes the review screen. */

const MAX_FOODS = 12;

function finite(value: unknown, min: number, max: number): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : null;
}

function text(value: unknown, max: number): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;
}

export function parseEstimatedFood(raw: unknown): EstimatedFood | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const item = raw as Record<string, unknown>;
  const name = text(item.name, 80);
  const estimatedGrams = finite(item.estimatedGrams, 1, 5000);
  const calories = finite(item.calories, 0, 5000);
  if (!name || estimatedGrams === null || calories === null) return null;
  return {
    name,
    portionDescription: text(item.portionDescription, 80) ?? `${Math.round(estimatedGrams)} g`,
    estimatedGrams,
    confidence: finite(item.confidence, 0, 1) ?? 0.5,
    chain: text(item.chain, 40),
    calories,
    protein: finite(item.protein, 0, 1000) ?? 0,
    carbs: finite(item.carbs, 0, 1000) ?? 0,
    fat: finite(item.fat, 0, 1000) ?? 0,
  };
}

export function parseMealAnalysis(raw: unknown): MealAnalysis | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const body = raw as Record<string, unknown>;
  if (!Array.isArray(body.foods)) return null;
  const foods = body.foods.map(parseEstimatedFood).filter((food): food is EstimatedFood => food !== null).slice(0, MAX_FOODS);
  return { foods, note: text(body.note, 300) };
}
