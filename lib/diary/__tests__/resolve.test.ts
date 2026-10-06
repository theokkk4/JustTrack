import { MAX_FOOD_AGE_MS } from '@/lib/food/foodCache';
import type { CachedFood, MealItemRecord, MealRecord } from '@/types';
import { missingFoodIds, resolveMealItem, resolveMeals, storedEntryAsFood } from '../resolve';

const NOW = Date.parse('2026-09-25T12:00:00Z');

const chicken: CachedFood = {
  id: '1641',
  name: 'Chicken Breast',
  brand: null,
  type: 'generic',
  fetchedAt: new Date(NOW - 60_000).toISOString(),
  servings: [
    { id: '100g', description: '100 g', metricAmount: 100, metricUnit: 'g', calories: 165, protein: 31, carbs: 0, fat: 3.6, isDefault: true },
    { id: 'breast', description: '1 breast', metricAmount: 172, metricUnit: 'g', calories: 284, protein: 53.4, carbs: 0, fat: 6.2, isDefault: false },
  ],
};

function record(overrides: Partial<MealItemRecord> = {}): MealItemRecord {
  return {
    id: 'item',
    mealId: 'meal',
    source: 'fatsecret',
    externalFoodId: '1641',
    externalServingId: '100g',
    servings: 1.5,
    amountUnit: 'g',
    isEstimate: false,
    foodName: null,
    brand: null,
    grams: null,
    nutrition: null,
    createdAt: '2026-09-25T12:00:00Z',
    ...overrides,
  };
}

function meal(items: MealItemRecord[]): MealRecord {
  return { id: 'meal', userId: 'user', name: null, mealType: 'dinner', eatenAt: '2026-09-25T18:30:00Z', createdAt: '2026-09-25T18:30:00Z', items };
}

const foods = new Map([[chicken.id, chicken]]);

describe('resolveMealItem', () => {
  it('computes a FatSecret entry’s nutrition from the cached serving', () => {
    const item = resolveMealItem(record(), meal([]), foods, NOW);
    expect(item).toMatchObject({
      foodName: 'Chicken Breast',
      amountLabel: '150 g',
      calories: 247.5,
      protein: 46.5,
      carbs: 0,
      fat: 5.4,
      mealType: 'dinner',
      resolved: true,
    });
  });

  it('marks a FatSecret entry unresolved when its food isn’t loaded, counting it as zero', () => {
    const item = resolveMealItem(record({ externalFoodId: '999' }), meal([]), foods, NOW);
    expect(item).toMatchObject({ resolved: false, calories: 0, foodName: 'Food details unavailable', amountLabel: '1.5 servings' });
  });

  it('never shows FatSecret content that has turned 23 hours old', () => {
    const item = resolveMealItem(record(), meal([]), foods, Date.parse(chicken.fetchedAt) + MAX_FOOD_AGE_MS);
    expect(item.resolved).toBe(false);
  });

  it('keeps the name but stays unresolved when the stored serving has been removed', () => {
    const item = resolveMealItem(record({ externalServingId: 'gone' }), meal([]), foods, NOW);
    expect(item).toMatchObject({ resolved: false, foodName: 'Chicken Breast', calories: 0 });
  });

  it('uses stored nutrition for other sources', () => {
    const item = resolveMealItem(
      record({
        source: 'ai_estimate',
        externalFoodId: null,
        externalServingId: null,
        foodName: 'Burrito bowl',
        grams: 412,
        amountUnit: 'g',
        servings: 1,
        isEstimate: true,
        nutrition: { calories: 655, protein: 41, carbs: 70, fat: 22 },
      }),
      meal([]),
      foods,
      NOW
    );
    expect(item).toMatchObject({ foodName: 'Burrito bowl', amountLabel: '412 g', calories: 655, isEstimate: true, resolved: true });
  });

  it('describes stored serving counts with their weight', () => {
    const item = resolveMealItem(
      record({ source: 'custom', foodName: 'Protein bar', grams: 120, servings: 2, amountUnit: 'serving', nutrition: { calories: 420, protein: 40, carbs: 44, fat: 14 } }),
      meal([]),
      foods,
      NOW
    );
    expect(item.amountLabel).toBe('2 servings · 120 g');
  });
});

describe('resolveMeals / missingFoodIds', () => {
  it('resolves every item and lists FatSecret foods that still need loading', () => {
    const meals = [meal([record(), record({ id: 'b', externalFoodId: '555' }), record({ id: 'c', externalFoodId: '555' })])];
    expect(resolveMeals(meals, foods, NOW)[0].items.map((item) => item.resolved)).toEqual([true, false, false]);
    expect(missingFoodIds(meals, foods, NOW)).toEqual(['555']);
  });
});

describe('storedEntryAsFood', () => {
  it('turns a stored entry into a one-serving food for editing', () => {
    const food = storedEntryAsFood(
      record({ source: 'custom', foodName: 'Protein bar', grams: 120, servings: 2, nutrition: { calories: 420, protein: 40, carbs: 44, fat: 14 } })
    );
    expect(food?.servings).toEqual([
      { id: 'entry', description: '1 serving (60 g)', metricAmount: 60, metricUnit: 'g', calories: 210, protein: 20, carbs: 22, fat: 7, isDefault: true },
    ]);
  });

  it('returns null for a FatSecret record (it has no stored content)', () => {
    expect(storedEntryAsFood(record())).toBeNull();
  });
});
