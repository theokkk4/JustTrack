import type { Tables } from '@/types/database';
import { mapMealItemRow, mapMealRow, recordToNewItem, toMealItemPayload } from '../records';

function itemRow(overrides: Partial<Tables<'meal_items'>> = {}): Tables<'meal_items'> {
  return {
    id: 'item-1',
    meal_id: 'meal-1',
    user_id: 'user-1',
    source: 'fatsecret',
    external_food_id: '1641',
    external_serving_id: '4822',
    servings: 1.5,
    amount_unit: 'serving',
    is_estimate: false,
    food_name: null,
    brand: null,
    grams: null,
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    created_at: '2026-09-25T12:00:00Z',
    ...overrides,
  };
}

describe('mapMealItemRow', () => {
  it('maps a FatSecret row to an IDs-only record', () => {
    expect(mapMealItemRow(itemRow())).toEqual({
      id: 'item-1',
      mealId: 'meal-1',
      source: 'fatsecret',
      externalFoodId: '1641',
      externalServingId: '4822',
      servings: 1.5,
      amountUnit: 'serving',
      isEstimate: false,
      foodName: null,
      brand: null,
      grams: null,
      nutrition: null,
      createdAt: '2026-09-25T12:00:00Z',
    });
  });

  it('keeps stored nutrition for other sources', () => {
    const record = mapMealItemRow(
      itemRow({ source: 'custom', external_food_id: null, external_serving_id: null, food_name: 'Protein bar', grams: 60, calories: 210, protein: 20, carbs: 22, fat: 7 })
    );
    expect(record?.nutrition).toEqual({ calories: 210, protein: 20, carbs: 22, fat: 7 });
    expect(record?.foodName).toBe('Protein bar');
  });

  it('drops rows with an unknown source and defaults an unknown amount unit', () => {
    expect(mapMealItemRow(itemRow({ source: 'mystery' }))).toBeNull();
    expect(mapMealItemRow(itemRow({ amount_unit: 'cups' }))?.amountUnit).toBe('serving');
  });
});

describe('mapMealRow', () => {
  it('maps the meal and its items, skipping unknown meal types', () => {
    const row = {
      id: 'meal-1',
      user_id: 'user-1',
      name: null,
      meal_type: 'lunch',
      eaten_at: '2026-09-25T12:00:00Z',
      created_at: '2026-09-25T12:00:00Z',
      meal_items: [itemRow(), itemRow({ id: 'bad', source: 'mystery' })],
    };
    const meal = mapMealRow(row);
    expect(meal?.mealType).toBe('lunch');
    expect(meal?.items.map((item) => item.id)).toEqual(['item-1']);
    expect(mapMealRow({ ...row, meal_type: 'brunch' })).toBeNull();
  });
});

describe('toMealItemPayload', () => {
  it('sends nothing but IDs and the amount for FatSecret items', () => {
    expect(
      toMealItemPayload({ source: 'fatsecret', externalFoodId: '1641', externalServingId: '4822', servings: 0.70588235, amountUnit: 'g' })
    ).toEqual({
      source: 'fatsecret',
      external_food_id: '1641',
      external_serving_id: '4822',
      servings: 0.7059,
      amount_unit: 'g',
      is_estimate: false,
      food_name: null,
      brand: null,
      grams: null,
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
    });
  });

  it('sends rounded content for stored-content items', () => {
    const payload = toMealItemPayload({
      source: 'ai_estimate',
      foodName: '  Chicken burrito bowl ',
      brand: '',
      servings: 1,
      amountUnit: 'g',
      grams: 412.44,
      nutrition: { calories: 655.55, protein: 41.26, carbs: 70.04, fat: 21.96 },
      isEstimate: true,
    });
    expect(payload).toMatchObject({
      source: 'ai_estimate',
      food_name: 'Chicken burrito bowl',
      brand: null,
      grams: 412.4,
      calories: 655.6,
      protein: 41.3,
      carbs: 70,
      fat: 22,
      is_estimate: true,
      external_serving_id: null,
    });
  });
});

describe('recordToNewItem', () => {
  it('copies a FatSecret entry as IDs and amount', () => {
    const record = mapMealItemRow(itemRow());
    expect(record && recordToNewItem(record)).toEqual({
      source: 'fatsecret',
      externalFoodId: '1641',
      externalServingId: '4822',
      servings: 1.5,
      amountUnit: 'serving',
      isEstimate: false,
    });
  });

  it('refuses to copy an incomplete row', () => {
    const record = mapMealItemRow(itemRow({ external_serving_id: null }));
    expect(record && recordToNewItem(record)).toBeNull();
  });
});
