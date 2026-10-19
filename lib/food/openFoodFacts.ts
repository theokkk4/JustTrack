import { Platform } from 'react-native';

import { REPOSITORY_URL } from '@/constants/brand';
import type { FoodDetail, FoodServing, MetricUnit } from '@/types';

/**
 * Open Food Facts: a free, open database of packaged foods (ODbL). No API key;
 * the app calls it directly, so each user's requests count against their own
 * rate limit rather than a shared server's.
 */

const SEARCH_URL = 'https://search.openfoodfacts.org/search';
const PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product';
const FIELDS = 'code,product_name,brands,nutriments,serving_size,serving_quantity,serving_quantity_unit';
export const OFF_PAGE_SIZE = 20;

/** OFF asks apps to identify themselves. Browsers won't let pages set User-Agent, so only native does. */
const HEADERS: Record<string, string> =
  Platform.OS === 'web' ? {} : { 'User-Agent': `JustTrack/1.0 (open source; ${REPOSITORY_URL})` };

interface OffProduct {
  code?: unknown;
  product_name?: unknown;
  brands?: unknown;
  nutriments?: Record<string, unknown>;
  serving_size?: unknown;
  serving_quantity?: unknown;
  serving_quantity_unit?: unknown;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

function numberFrom(value: unknown): number | null {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function text(value: unknown): string | null {
  if (Array.isArray(value)) return text(value.filter((part) => typeof part === 'string').join(', '));
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

/**
 * A product with usable nutrition, or null. Values are per 100 g (OFF's
 * standard basis); a labeled serving size becomes the default serving.
 */
export function normalizeOffProduct(product: OffProduct): FoodDetail | null {
  const code = text(product.code);
  const name = text(product.product_name);
  const n = product.nutriments ?? {};
  const kj = numberFrom(n['energy-kj_100g']);
  const kcal = numberFrom(n['energy-kcal_100g']) ?? (kj !== null ? kj / 4.184 : null);
  if (!code || !/^\d{6,14}$/.test(code) || !name || kcal === null || kcal > 950) return null;

  const per100 = {
    calories: kcal,
    protein: numberFrom(n.proteins_100g) ?? 0,
    carbs: numberFrom(n.carbohydrates_100g) ?? 0,
    fat: numberFrom(n.fat_100g) ?? 0,
  };
  const scaled = (amount: number) => ({
    calories: round1((per100.calories * amount) / 100),
    protein: round1((per100.protein * amount) / 100),
    carbs: round1((per100.carbs * amount) / 100),
    fat: round1((per100.fat * amount) / 100),
  });

  const unit: MetricUnit = text(product.serving_quantity_unit)?.toLowerCase() === 'ml' ? 'ml' : 'g';
  const servingAmount = numberFrom(product.serving_quantity);
  const servings: FoodServing[] = [];
  if (servingAmount && servingAmount > 0 && servingAmount < 5000) {
    const label = text(product.serving_size);
    servings.push({
      id: 'serving',
      description: label ? `1 serving (${label})` : `1 serving (${round1(servingAmount)} ${unit})`,
      metricAmount: servingAmount,
      metricUnit: unit,
      isDefault: true,
      ...scaled(servingAmount),
    });
  }
  servings.push({ id: `100${unit}`, description: `100 ${unit}`, metricAmount: 100, metricUnit: unit, isDefault: servings.length === 0, ...scaled(100) });

  return { id: `off:${code}`, source: 'openfoodfacts', externalId: code, name, brand: text(product.brands), servings };
}

export interface OffSearchPage {
  foods: FoodDetail[];
  page: number;
  pageCount: number;
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { headers: HEADERS, signal });
  if (response.status === 404) return null;
  if (response.status === 429) throw new Error('Packaged-food search is busy right now. Try again in a minute.');
  if (!response.ok) throw new Error('Couldn’t reach Open Food Facts. Please try again.');
  return response.json();
}

/** Searches packaged foods. `page` starts at 1. */
export async function searchOpenFoodFacts(query: string, page = 1, signal?: AbortSignal): Promise<OffSearchPage> {
  const params = new URLSearchParams({ q: query, page: String(page), page_size: String(OFF_PAGE_SIZE), fields: FIELDS });
  const body = (await getJson(`${SEARCH_URL}?${params}`, signal)) as { hits?: OffProduct[]; page_count?: number } | null;
  const foods = (body?.hits ?? []).map(normalizeOffProduct).filter((food): food is FoodDetail => food !== null);
  return { foods, page, pageCount: typeof body?.page_count === 'number' ? body.page_count : page };
}

/** One product by barcode, or null if Open Food Facts doesn't have it (or it has no nutrition facts). */
export async function getOpenFoodFactsProduct(barcode: string, signal?: AbortSignal): Promise<FoodDetail | null> {
  const digits = barcode.replace(/\D/g, '');
  if (!/^\d{6,14}$/.test(digits)) return null;
  const body = (await getJson(`${PRODUCT_URL}/${digits}.json?fields=${FIELDS}`, signal)) as { status?: number; product?: OffProduct } | null;
  return body?.status === 1 && body.product ? normalizeOffProduct({ code: digits, ...body.product }) : null;
}
