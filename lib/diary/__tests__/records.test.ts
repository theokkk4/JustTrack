import type { FoodDetail, MealItemRecord } from '@/types';
import type { Tables } from '@/types/database';
import { mapMealItemRow, mapMealRow, newItemFromFood, portionUpdate, recordToNewItem, toMealItemPayload } from '../records';
import { amountLabel, resolveMealItem, storedEntryAsFood } from '../resolve';

const yogurt: FoodDetail = {
  id: 'usda:1',
  source: 'usda',
  externalId: '1',
  name: 'Yogurt, Greek, plain',
  brand: null,
  servings: [
    { id: 'portion:1 container', description: '1 container (170 g)', metricAmount: 170, metricUnit: 'g', calories: 100, protein: 17, carbs: 6, fat: 0.7, isDefault: true },
    { id: '100g', description: '100 g', metricAmount: 100, metricUnit: 'g', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, isDefault: false },
  ],
};

function row(overrides: Partial<Tables<'meal_items'>> = {}): Tables<'meal_items'> {
  return {
    id: 'item-1',
    meal_id: 'meal-1',
    user_id: 'user-1',
    source: 'usda',
    external_food_id: '1',
    external_serving_id: 'portion:1 container',
    servings: 1.5,
    amount_unit: 'serving',
    is_estimate: false,
    food_name: 'Yogurt, Greek, plain',
    brand: null,
    grams: 255,
    calories: 150,
    protein: 25.5,
    carbs: 9,
    fat: 1.1,
    created_at: '2026-10-19T12:00:00Z',
    ...overrides,
  };
}

describe('mapping rows', () => {
  it('maps an item row, dropping unknown sources', () => {
    expect(mapMealItemRow(row())).toMatchObject({ source: 'usda', foodName: 'Yogurt, Greek, plain', grams: 255, nutrition: { calories: 150 } });
    expect(mapMealItemRow(row({ source: 'fatsecret' }))).toBeNull();
    expect(mapMealItemRow(row({ amount_unit: 'cups' }))?.amountUnit).toBe('serving');
  });

  it('maps a meal and skips unknown meal types', () => {
    const meal = { id: 'meal-1', user_id: 'u', name: null, meal_type: 'lunch', eaten_at: 'x', created_at: 'x', meal_items: [row()] };
    expect(mapMealRow(meal)?.items).toHaveLength(1);
    expect(mapMealRow({ ...meal, meal_type: 'brunch' })).toBeNull();
  });
});

describe('logging a food', () => {
  it('stores the chosen portion with its nutrition', () => {
    expect(newItemFromFood(yogurt, { servingId: '100g', servings: 1.5, amountUnit: 'g' })).toMatchObject({
      source: 'usda',
      externalFoodId: '1',
      externalServingId: '100g',
      grams: 150,
      nutrition: { calories: 88.5, protein: 15 },
    });
    expect(newItemFromFood(yogurt, { servingId: 'nope', servings: 1, amountUnit: 'serving' })).toBeNull();
  });

  it('rounds the payload for the database', () => {
    const payload = toMealItemPayload({
      source: 'openfoodfacts',
      externalFoodId: '0894700010137',
      foodName: '  Nonfat Greek Yogurt ',
      brand: '',
      servings: 0.333333,
      amountUnit: 'serving',
      grams: 56.6666,
      nutrition: { calories: 29.96, protein: 5.33, carbs: 2, fat: 0 },
    });
    expect(payload).toMatchObject({ food_name: 'Nonfat Greek Yogurt', brand: null, servings: 0.3333, grams: 56.7, calories: 30, protein: 5.3 });
  });
});

describe('editing an entry', () => {
  it('recalculates nutrition and remembers the serving', () => {
    expect(portionUpdate(yogurt, { servingId: 'portion:1 container', servings: 2, amountUnit: 'serving' })).toEqual({
      servings: 2,
      amount_unit: 'serving',
      external_serving_id: 'portion:1 container',
      grams: 340,
      calories: 200,
      protein: 34,
      carbs: 12,
      fat: 1.4,
    });
  });

  it('rescales any entry from its own stored values', () => {
    const record = mapMealItemRow(row()) as MealItemRecord;
    const food = storedEntryAsFood(record);
    expect(food?.servings[0]).toMatchObject({ id: 'entry', metricAmount: 170, calories: 100 });
    const update = food && portionUpdate(food, { servingId: 'entry', servings: 3, amountUnit: 'serving' });
    expect(update).toMatchObject({ servings: 3, grams: 510, calories: 300 });
    expect(update).not.toHaveProperty('external_serving_id');
  });

  it('duplicates an entry exactly', () => {
    const record = mapMealItemRow(row()) as MealItemRecord;
    expect(recordToNewItem(record)).toMatchObject({ source: 'usda', foodName: record.foodName, servings: 1.5, nutrition: record.nutrition });
  });
});

describe('amount labels', () => {
  it('reads naturally for portions, grams, and plain servings', () => {
    expect(amountLabel({ amountUnit: 'serving', servings: 1.5, grams: 255, externalServingId: 'portion:1 container' })).toBe('1.5 × 1 container');
    expect(amountLabel({ amountUnit: 'serving', servings: 1, grams: 170, externalServingId: 'portion:1 container' })).toBe('1 container');
    expect(amountLabel({ amountUnit: 'g', servings: 1.5, grams: 150, externalServingId: '100g' })).toBe('150 g');
    expect(amountLabel({ amountUnit: 'serving', servings: 2, grams: 0, externalServingId: null })).toBe('2 servings');
  });

  it('resolves an entry for display', () => {
    const record = mapMealItemRow(row()) as MealItemRecord;
    const meal = { id: 'meal-1', userId: 'u', name: null, mealType: 'lunch' as const, eatenAt: 'x', createdAt: 'x' };
    expect(resolveMealItem(record, meal)).toMatchObject({ foodName: 'Yogurt, Greek, plain', amountLabel: '1.5 × 1 container', calories: 150, mealType: 'lunch' });
  });
});
