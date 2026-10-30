import { calculateNutrition } from '@/lib/nutrition/calculateNutrition';
import { metricServing } from '@/lib/nutrition/portion';
import { matchChainItem } from '@/lib/food/chainDatabase';
import type { EstimatedFood, FoodDetail, MealAnalysis, NutritionValues } from '@/types';

/**
 * The photo scan in progress: the picture, what the model found, and the
 * user's edits before anything is logged. Lives in memory only — a photo
 * is analyzed and then forgotten.
 */

export interface ReviewRow {
  id: string;
  name: string;
  portionDescription: string;
  grams: number;
  confidence: number;
  /** Nutrition at `basis.grams`; everything else scales from it. */
  basis: { grams: number; nutrition: NutritionValues };
  /** Set once the user swaps in a database food. */
  matchedFood: { name: string; brand: string | null; source: FoodDetail['source']; externalId: string } | null;
  /** The chain the scanner recognized, whether or not a menu item matched. */
  chain: string | null;
}

export interface ReviewState {
  photoUri: string | null;
  /** A small copy of the photo that's saved with the entries, so meal cards show the plate. */
  thumbnailUri: string | null;
  status: 'idle' | 'analyzing' | 'ready' | 'error';
  error: string | null;
  errorCode: string | null;
  note: string | null;
  rows: ReviewRow[];
}

const EMPTY: ReviewState = { photoUri: null, thumbnailUri: null, status: 'idle', error: null, errorCode: null, note: null, rows: [] };

let state: ReviewState = EMPTY;
const listeners = new Set<() => void>();

function publish(next: ReviewState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export const reviewStore = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

let rowCounter = 0;

export function rowFromEstimate(food: EstimatedFood): ReviewRow {
  const grams = Math.max(1, Math.round(food.estimatedGrams));
  return {
    id: `row-${++rowCounter}`,
    name: food.name,
    portionDescription: food.portionDescription,
    grams,
    confidence: food.confidence,
    basis: { grams, nutrition: { calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat } },
    matchedFood: null,
    chain: food.chain,
  };
}

/** A recognized chain item snaps to its menu nutrition, so the row isn't an estimate anymore. */
function withMenuMatch(row: ReviewRow): ReviewRow {
  if (!row.chain) return row;
  const food = matchChainItem(row.chain, row.name, row.portionDescription);
  return (food && matchedRow(row, food)) ?? row;
}

function matchedRow(row: ReviewRow, food: FoodDetail): ReviewRow | null {
  const base = metricServing(food, 'g') ?? food.servings.find((serving) => serving.metricAmount) ?? food.servings.find((serving) => serving.isDefault) ?? null;
  if (!base) return null;
  // Menu items list nutrition per serving with no weight; the estimated grams stand in for one serving.
  const grams = base.metricAmount ?? row.grams;
  return {
    ...row,
    name: food.name,
    portionDescription: base.metricAmount ? row.portionDescription : base.description,
    basis: { grams, nutrition: { calories: base.calories, protein: base.protein, carbs: base.carbs, fat: base.fat } },
    matchedFood: { name: food.name, brand: food.brand, source: food.source, externalId: food.externalId },
  };
}

export function rowNutrition(row: ReviewRow): NutritionValues {
  return calculateNutrition({ referenceGrams: row.basis.grams, ...row.basis.nutrition }, row.grams);
}

export function startAnalysis(photoUri: string): void {
  publish({ ...EMPTY, photoUri, status: 'analyzing' });
}

export function setReviewThumbnail(thumbnailUri: string | null): void {
  publish({ ...state, thumbnailUri });
}

export function finishAnalysis(analysis: MealAnalysis): void {
  publish({ ...state, status: 'ready', note: analysis.note, rows: analysis.foods.map((food) => withMenuMatch(rowFromEstimate(food))) });
}

export function failAnalysis(error: string, errorCode: string | null): void {
  publish({ ...state, status: 'error', error, errorCode });
}

export function setRowGrams(id: string, grams: number): void {
  publish({ ...state, rows: state.rows.map((row) => (row.id === id ? { ...row, grams: Math.max(1, Math.round(grams)) } : row)) });
}

export function removeRow(id: string): void {
  publish({ ...state, rows: state.rows.filter((row) => row.id !== id) });
}

/** Swaps the model's guess for a database food, keeping the estimated grams. */
export function matchRowToFood(id: string, food: FoodDetail): void {
  publish({ ...state, rows: state.rows.map((row) => (row.id === id ? (matchedRow(row, food) ?? row) : row)) });
}

export function resetReview(): void {
  publish(EMPTY);
}
