import type { CachedFood, MealItemRecord } from '@/types';
import { portionUpdate } from '../records';
import { storedEntryAsFood } from '../resolve';

const rice: CachedFood = {
  id: '4501',
  name: 'White Rice',
  brand: null,
  type: 'generic',
  fetchedAt: '2026-09-25T12:00:00Z',
  servings: [
    { id: 'cup', description: '1 cup', metricAmount: 158, metricUnit: 'g', calories: 206, protein: 4.3, carbs: 44.5, fat: 0.4, isDefault: true },
    { id: '100g', description: '100 g', metricAmount: 100, metricUnit: 'g', calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, isDefault: false },
  ],
};

const fatSecretEntry: MealItemRecord = {
  id: 'item',
  mealId: 'meal',
  source: 'fatsecret',
  externalFoodId: '4501',
  externalServingId: 'cup',
  servings: 1,
  amountUnit: 'serving',
  isEstimate: false,
  foodName: null,
  brand: null,
  grams: null,
  nutrition: null,
  createdAt: '2026-09-25T12:00:00Z',
};

describe('portionUpdate', () => {
  it('only changes the serving ID and count for FatSecret entries — never content', () => {
    expect(portionUpdate(fatSecretEntry, rice, { servingId: '100g', servings: 1.55555, amountUnit: 'g' })).toEqual({
      external_serving_id: '100g',
      servings: 1.5556,
      amount_unit: 'g',
    });
  });

  it('recalculates grams and nutrition for stored-content entries', () => {
    const custom: MealItemRecord = {
      ...fatSecretEntry,
      source: 'custom',
      externalFoodId: null,
      externalServingId: null,
      foodName: 'Protein bar',
      grams: 60,
      nutrition: { calories: 210, protein: 20, carbs: 22, fat: 7 },
    };
    const food = storedEntryAsFood(custom);
    expect(food && portionUpdate(custom, food, { servingId: 'entry', servings: 1.5, amountUnit: 'serving' })).toEqual({
      servings: 1.5,
      amount_unit: 'serving',
      grams: 90,
      calories: 315,
      protein: 30,
      carbs: 33,
      fat: 10.5,
    });
  });

  it('rejects unknown servings and non-positive amounts', () => {
    expect(portionUpdate(fatSecretEntry, rice, { servingId: 'nope', servings: 1, amountUnit: 'serving' })).toBeNull();
    expect(portionUpdate(fatSecretEntry, rice, { servingId: 'cup', servings: 0, amountUnit: 'serving' })).toBeNull();
  });
});
