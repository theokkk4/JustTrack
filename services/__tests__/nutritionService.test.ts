import type { MealItem, MealType, MealWithItems } from '@/types';
import { buildMealSections, calculateDailyTotals } from '../nutritionService';

function item(overrides: Partial<MealItem> & Pick<MealItem, 'id' | 'createdAt'>): MealItem {
  return {
    mealId: 'meal',
    foodName: 'Food',
    brand: null,
    externalFoodId: null,
    source: 'fatsecret',
    servings: 1,
    grams: 100,
    calories: 100,
    protein: 10,
    carbs: 10,
    fat: 1,
    ...overrides,
  };
}

function meal(id: string, mealType: MealType, items: MealItem[]): MealWithItems {
  return { id, userId: 'user', name: null, mealType, eatenAt: '2026-09-23T12:00:00Z', createdAt: '2026-09-23T12:00:00Z', items };
}

describe('buildMealSections', () => {
  it('always returns all four sections in diary order, even with no meals', () => {
    const sections = buildMealSections([]);
    expect(sections.map((s) => s.mealType)).toEqual(['breakfast', 'lunch', 'dinner', 'snacks']);
    sections.forEach((section) => {
      expect(section.items).toEqual([]);
      expect(section.totals).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    });
  });

  it('computes per-meal totals from that meal type only', () => {
    const sections = buildMealSections([
      meal('m1', 'lunch', [
        item({ id: 'a', createdAt: '2026-09-23T12:00:00Z', calories: 248, protein: 46, carbs: 0, fat: 5 }),
        item({ id: 'b', createdAt: '2026-09-23T12:01:00Z', calories: 260, protein: 5, carbs: 57, fat: 0.5 }),
      ]),
      meal('m2', 'dinner', [item({ id: 'c', createdAt: '2026-09-23T19:00:00Z', calories: 35, protein: 2, carbs: 7, fat: 0.3 })]),
    ]);

    const lunch = sections.find((s) => s.mealType === 'lunch');
    const dinner = sections.find((s) => s.mealType === 'dinner');
    expect(lunch?.totals).toEqual({ calories: 508, protein: 51, carbs: 57, fat: 5.5 });
    expect(dinner?.totals).toEqual({ calories: 35, protein: 2, carbs: 7, fat: 0.3 });
  });

  it('merges multiple meals of the same type and orders items by when they were logged', () => {
    const sections = buildMealSections([
      meal('late', 'snacks', [item({ id: 'second', createdAt: '2026-09-23T21:00:00Z' })]),
      meal('early', 'snacks', [item({ id: 'first', createdAt: '2026-09-23T10:00:00Z' })]),
    ]);

    const snacks = sections.find((s) => s.mealType === 'snacks');
    expect(snacks?.items.map((i) => i.id)).toEqual(['first', 'second']);
    expect(snacks?.totals.calories).toBe(200);
  });
});

describe('calculateDailyTotals', () => {
  it('sums every section into the day total', () => {
    const sections = buildMealSections([
      meal('b', 'breakfast', [item({ id: '1', createdAt: '2026-09-23T08:00:00Z', calories: 480, protein: 30, carbs: 50, fat: 15 })]),
      meal('l', 'lunch', [item({ id: '2', createdAt: '2026-09-23T12:00:00Z', calories: 620, protein: 45, carbs: 60, fat: 20 })]),
      meal('d', 'dinner', [item({ id: '3', createdAt: '2026-09-23T19:00:00Z', calories: 742, protein: 67, carbs: 75, fat: 23 })]),
    ]);

    expect(calculateDailyTotals(sections)).toEqual({ calories: 1842, protein: 142, carbs: 185, fat: 58 });
  });

  it('is zero for an empty day', () => {
    expect(calculateDailyTotals(buildMealSections([]))).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});
