import type { EstimatedFood, FoodDetail, LogEntry } from '@/types';
import { amountLabel, buildMealSections, createEntry, entryAsFood, entryFromEstimate, entryFromFood, macroShares, rescaleEntry } from '../entries';

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

const NOW = new Date('2026-10-30T12:00:00Z');

describe('entryFromFood', () => {
  it('captures the chosen portion with its nutrition', () => {
    expect(entryFromFood(yogurt, { servingId: '100g', servings: 1.5, amountUnit: 'g' }, 'lunch')).toMatchObject({
      mealType: 'lunch',
      source: 'usda',
      externalFoodId: '1',
      externalServingId: '100g',
      grams: 150,
      calories: 88.5,
      protein: 15,
      isEstimate: false,
    });
    expect(entryFromFood(yogurt, { servingId: 'nope', servings: 1, amountUnit: 'serving' }, 'lunch')).toBeNull();
  });
});

describe('entryFromEstimate', () => {
  it('stores the scanner’s portion as grams and marks it estimated', () => {
    const food: EstimatedFood = { name: 'Burrito bowl', portionDescription: 'one bowl', estimatedGrams: 412.4, confidence: 0.8, calories: 655.55, protein: 41.26, carbs: 70, fat: 22 };
    expect(entryFromEstimate(food, 'dinner')).toMatchObject({ source: 'ai_estimate', isEstimate: true, grams: 412.4, amountUnit: 'g', servings: 1, calories: 655.6, protein: 41.3 });
  });
});

describe('createEntry / rescaleEntry / entryAsFood', () => {
  const base = createEntry(entryFromFood(yogurt, { servingId: 'portion:1 container', servings: 1, amountUnit: 'serving' }, 'breakfast') as never, NOW);

  it('stamps an id and the time', () => {
    expect(base.id).toBeTruthy();
    expect(base.loggedAt).toBe(NOW.toISOString());
  });

  it('rescales against the database food, remembering the serving', () => {
    const rescaled = rescaleEntry(base, yogurt, { servingId: '100g', servings: 2, amountUnit: 'g' });
    expect(rescaled).toMatchObject({ id: base.id, externalServingId: '100g', grams: 200, calories: 118, amountUnit: 'g' });
  });

  it('rescales against its own stored values when no database food is available', () => {
    const food = entryAsFood(base);
    expect(food?.servings[0]).toMatchObject({ id: 'entry', metricAmount: 170, calories: 100 });
    const rescaled = food && rescaleEntry(base, food, { servingId: 'entry', servings: 2, amountUnit: 'serving' });
    expect(rescaled).toMatchObject({ externalServingId: 'portion:1 container', grams: 340, calories: 200 });
  });
});

describe('amountLabel', () => {
  it('reads naturally for portions, grams, and plain servings', () => {
    expect(amountLabel({ amountUnit: 'serving', servings: 1.5, grams: 255, externalServingId: 'portion:1 container' })).toBe('1.5 × 1 container');
    expect(amountLabel({ amountUnit: 'serving', servings: 1, grams: 170, externalServingId: 'portion:1 container' })).toBe('1 container');
    expect(amountLabel({ amountUnit: 'g', servings: 1.5, grams: 150, externalServingId: '100g' })).toBe('150 g');
    expect(amountLabel({ amountUnit: 'serving', servings: 2, grams: 0, externalServingId: null })).toBe('2 servings');
  });
});

describe('buildMealSections / macroShares', () => {
  const entry = (id: string, mealType: LogEntry['mealType'], calories: number, loggedAt: string): LogEntry => ({
    id,
    loggedAt,
    mealType,
    source: 'custom',
    externalFoodId: null,
    externalServingId: null,
    foodName: id,
    brand: null,
    servings: 1,
    amountUnit: 'serving',
    grams: 100,
    isEstimate: false,
    imageUri: null,
    calories,
    protein: 10,
    carbs: 20,
    fat: 5,
  });

  it('always returns the four meals in order, oldest entries first', () => {
    const sections = buildMealSections([entry('late', 'snacks', 100, '2026-10-30T15:00:00Z'), entry('early', 'snacks', 50, '2026-10-30T10:00:00Z')]);
    expect(sections.map((section) => section.mealType)).toEqual(['breakfast', 'lunch', 'dinner', 'snacks']);
    expect(sections[3].entries.map((item) => item.id)).toEqual(['early', 'late']);
    expect(sections[3].totals.calories).toBe(150);
    expect(sections[0].totals.calories).toBe(0);
  });

  it('splits calories by macro using 4/4/9, and is all zero for an empty day', () => {
    const shares = macroShares({ calories: 0, protein: 25, carbs: 25, fat: 10 }); // 100 + 100 + 90
    expect(shares.protein).toBeCloseTo(100 / 290);
    expect(shares.fat).toBeCloseTo(90 / 290);
    expect(macroShares({ calories: 0, protein: 0, carbs: 0, fat: 0 })).toEqual({ protein: 0, carbs: 0, fat: 0 });
  });
});
