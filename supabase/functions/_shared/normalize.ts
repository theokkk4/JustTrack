/**
 * Turns FatSecret's JSON (all numbers as strings, one-item lists collapsed
 * to plain objects, optional fields everywhere) into the stable shapes the
 * app consumes. Pure functions with no Deno APIs, so they're unit-testable.
 */

export interface FoodServing {
  id: string;
  description: string;
  /** Grams (or ml) in one serving, when FatSecret provides it. */
  metricAmount: number | null;
  metricUnit: 'g' | 'ml' | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isDefault: boolean;
}

export interface FoodDetail {
  id: string;
  name: string;
  brand: string | null;
  type: 'generic' | 'brand';
  servings: FoodServing[];
}

export interface FoodSearchResult {
  id: string;
  name: string;
  brand: string | null;
  type: 'generic' | 'brand';
  /** e.g. "100g" or "1 cup" — what the headline numbers are measured per. */
  basis: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface FoodSearchPage {
  results: FoodSearchResult[];
  totalResults: number;
  pageNumber: number;
  maxResults: number;
}

const GRAMS_PER_OUNCE = 28.349523125;

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function foodType(value: unknown): 'generic' | 'brand' {
  return typeof value === 'string' && value.toLowerCase() === 'brand' ? 'brand' : 'generic';
}

export function normalizeServing(raw: unknown): FoodServing | null {
  if (!isObject(raw)) return null;
  const id = text(raw.serving_id);
  const description = text(raw.serving_description);
  const calories = parseNumber(raw.calories);
  if (!id || !description || calories === null) return null;

  let metricAmount = parseNumber(raw.metric_serving_amount);
  let metricUnit: FoodServing['metricUnit'] = null;
  const unit = text(raw.metric_serving_unit)?.toLowerCase();
  if (metricAmount !== null && metricAmount > 0) {
    if (unit === 'g' || unit === 'ml') {
      metricUnit = unit;
    } else if (unit === 'oz') {
      metricAmount = metricAmount * GRAMS_PER_OUNCE;
      metricUnit = 'g';
    } else {
      metricAmount = null;
    }
  } else {
    metricAmount = null;
  }

  return {
    id,
    description,
    metricAmount,
    metricUnit,
    calories,
    protein: parseNumber(raw.protein) ?? 0,
    carbs: parseNumber(raw.carbohydrate) ?? 0,
    fat: parseNumber(raw.fat) ?? 0,
    isDefault: raw.is_default === '1' || raw.is_default === 1,
  };
}

/** Normalizes a food.get / barcode `food` object. Returns null if it has no usable servings. */
export function normalizeFood(raw: unknown): FoodDetail | null {
  if (!isObject(raw)) return null;
  const id = text(raw.food_id);
  const name = text(raw.food_name);
  if (!id || !name) return null;

  const servingsContainer = isObject(raw.servings) ? raw.servings : {};
  const servings = asArray(servingsContainer.serving as unknown)
    .map(normalizeServing)
    .filter((serving): serving is FoodServing => serving !== null);
  if (servings.length === 0) return null;

  // Basic-tier keys don't get is_default; fall back to FatSecret's first serving.
  if (!servings.some((serving) => serving.isDefault)) {
    servings[0] = { ...servings[0], isDefault: true };
  }

  return { id, name, brand: text(raw.brand_name), type: foodType(raw.food_type), servings };
}

const DESCRIPTION_PATTERN =
  /^Per\s+(.+?)\s+-\s+Calories:\s*([\d.]+)\s*kcal\s*\|\s*Fat:\s*([\d.]+)\s*g\s*\|\s*Carbs:\s*([\d.]+)\s*g\s*\|\s*Protein:\s*([\d.]+)\s*g/i;

/** Parses foods.search's summary line: "Per 100g - Calories: 165kcal | Fat: 3.57g | Carbs: 0.00g | Protein: 31.02g". */
export function parseFoodDescription(description: string): Pick<FoodSearchResult, 'basis' | 'calories' | 'protein' | 'carbs' | 'fat'> | null {
  const match = DESCRIPTION_PATTERN.exec(description.trim());
  if (!match) return null;
  return {
    basis: match[1],
    calories: Number(match[2]),
    fat: Number(match[3]),
    carbs: Number(match[4]),
    protein: Number(match[5]),
  };
}

export function normalizeSearch(raw: unknown): FoodSearchPage {
  const container = isObject(raw) && isObject(raw.foods) ? raw.foods : {};
  const results = asArray(container.food as unknown)
    .filter(isObject)
    .map((food): FoodSearchResult | null => {
      const id = text(food.food_id);
      const name = text(food.food_name);
      if (!id || !name) return null;
      const summary = parseFoodDescription(text(food.food_description) ?? '');
      return {
        id,
        name,
        brand: text(food.brand_name),
        type: foodType(food.food_type),
        basis: summary?.basis ?? null,
        calories: summary?.calories ?? null,
        protein: summary?.protein ?? null,
        carbs: summary?.carbs ?? null,
        fat: summary?.fat ?? null,
      };
    })
    .filter((result): result is FoodSearchResult => result !== null);

  return {
    results,
    totalResults: parseNumber(container.total_results) ?? results.length,
    pageNumber: parseNumber(container.page_number) ?? 0,
    maxResults: parseNumber(container.max_results) ?? results.length,
  };
}

/**
 * FatSecret expects GTIN-13. Scanners report UPC-A (12), EAN-8 (8),
 * EAN-13 (13) or GTIN-14 (14); pad or trim to 13 where that's lossless.
 */
export function toGtin13(barcode: string): string | null {
  const digits = barcode.replace(/\D/g, '');
  if (digits.length === 13) return digits;
  if (digits.length === 12 || digits.length === 8) return digits.padStart(13, '0');
  if (digits.length === 14 && digits.startsWith('0')) return digits.slice(1);
  return null;
}
