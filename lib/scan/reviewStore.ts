import { calculateNutrition } from '@/lib/nutrition/calculateNutrition';
import { metricServing } from '@/lib/nutrition/portion';
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
  matchedFood: { name: string; brand: string | null; source: 'usda' | 'openfoodfacts'; externalId: string } | null;
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
  publish({ ...state, status: 'ready', note: analysis.note, rows: analysis.foods.map(rowFromEstimate) });
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
  const base = metricServing(food, 'g') ?? food.servings.find((serving) => serving.metricAmount) ?? null;
  if (!base?.metricAmount) return;
  publish({
    ...state,
    rows: state.rows.map((row) =>
      row.id === id
        ? {
            ...row,
            name: food.name,
            basis: { grams: base.metricAmount as number, nutrition: { calories: base.calories, protein: base.protein, carbs: base.carbs, fat: base.fat } },
            matchedFood: { name: food.name, brand: food.brand, source: food.source, externalId: food.externalId },
          }
        : row
    ),
  });
}

export function resetReview(): void {
  publish(EMPTY);
}
