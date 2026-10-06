import type { FoodDetail, FoodServing } from '@/types';
import {
  choiceKey,
  defaultAmount,
  describePortion,
  fromStoredPortion,
  metricServing,
  portionNutrition,
  portionOptions,
  toStoredPortion,
} from '../portion';

function serving(overrides: Partial<FoodServing> & Pick<FoodServing, 'id' | 'description'>): FoodServing {
  return { metricAmount: null, metricUnit: null, calories: 100, protein: 10, carbs: 10, fat: 1, isDefault: false, ...overrides };
}

const rice: FoodDetail = {
  id: '4501',
  name: 'White Rice',
  brand: null,
  type: 'generic',
  servings: [
    serving({ id: 'cup', description: '1 cup', metricAmount: 158, metricUnit: 'g', calories: 206, protein: 4.3, carbs: 44.5, fat: 0.4, isDefault: true }),
    serving({ id: '100g', description: '100 g', metricAmount: 100, metricUnit: 'g', calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3 }),
    serving({ id: 'oz', description: '1 oz', metricAmount: 28.35, metricUnit: 'g', calories: 37, protein: 0.8, carbs: 8, fat: 0.1 }),
  ],
};

const bar: FoodDetail = {
  id: '99',
  name: 'Granola Bar',
  brand: 'Nature Valley',
  type: 'brand',
  servings: [serving({ id: 'bar', description: '1 bar', metricAmount: 42.5, metricUnit: 'g', calories: 190, isDefault: true })],
};

const soda: FoodDetail = {
  id: '7',
  name: 'Cola',
  brand: null,
  type: 'generic',
  servings: [serving({ id: 'can', description: '1 can', metricAmount: 355, metricUnit: 'ml', calories: 140, isDefault: true })],
};

const mystery: FoodDetail = {
  id: '1',
  name: 'Soup',
  brand: null,
  type: 'generic',
  servings: [serving({ id: 'bowl', description: '1 bowl', isDefault: true })],
};

describe('metricServing', () => {
  it('prefers a "100 g" serving as the base for gram amounts', () => {
    expect(metricServing(rice, 'g')?.id).toBe('100g');
  });

  it('falls back to the default metric serving, and to nothing when there is none', () => {
    expect(metricServing(bar, 'g')?.id).toBe('bar');
    expect(metricServing(bar, 'ml')).toBeNull();
    expect(metricServing(mystery, 'g')).toBeNull();
  });
});

describe('portionOptions', () => {
  it('lists the default serving first, then the rest, then metric units', () => {
    expect(portionOptions(rice).map((option) => option.label)).toEqual(['1 cup', '100 g', '1 oz', 'Grams (g)']);
    expect(portionOptions(soda).map((option) => option.label)).toEqual(['1 can', 'Milliliters (ml)']);
    expect(portionOptions(mystery).map((option) => choiceKey(option.choice))).toEqual(['serving:bowl']);
  });
});

describe('toStoredPortion / fromStoredPortion', () => {
  it('stores serving counts as-is', () => {
    expect(toStoredPortion(rice, { kind: 'serving', servingId: 'cup' }, 1.5)).toEqual({
      servingId: 'cup',
      servings: 1.5,
      amountUnit: 'serving',
    });
  });

  it('stores grams as a fraction of the metric base serving', () => {
    expect(toStoredPortion(rice, { kind: 'metric', unit: 'g' }, 150)).toEqual({ servingId: '100g', servings: 1.5, amountUnit: 'g' });
    expect(toStoredPortion(bar, { kind: 'metric', unit: 'g' }, 30)?.servings).toBeCloseTo(30 / 42.5, 6);
  });

  it('rejects amounts or choices that do not fit the food', () => {
    expect(toStoredPortion(rice, { kind: 'serving', servingId: 'cup' }, 0)).toBeNull();
    expect(toStoredPortion(rice, { kind: 'serving', servingId: 'missing' }, 1)).toBeNull();
    expect(toStoredPortion(mystery, { kind: 'metric', unit: 'g' }, 100)).toBeNull();
  });

  it('round-trips gram entries back to the grams the user typed', () => {
    const stored = toStoredPortion(bar, { kind: 'metric', unit: 'g' }, 30);
    expect(stored && fromStoredPortion(bar, stored)).toEqual({ choice: { kind: 'metric', unit: 'g' }, amount: 30 });
  });

  it('survives the database rounding servings to four decimals', () => {
    const stored = toStoredPortion(bar, { kind: 'metric', unit: 'g' }, 30) as NonNullable<ReturnType<typeof toStoredPortion>>;
    const fromDatabase = { ...stored, servings: Math.round(stored.servings * 10_000) / 10_000 };
    expect(fromStoredPortion(bar, fromDatabase).amount).toBe(30);
  });

  it('falls back to servings when the stored serving no longer has a metric size', () => {
    expect(fromStoredPortion(mystery, { servingId: 'bowl', servings: 2, amountUnit: 'g' })).toEqual({
      choice: { kind: 'serving', servingId: 'bowl' },
      amount: 2,
    });
  });

  it('falls back to one default serving when the stored serving has disappeared', () => {
    expect(fromStoredPortion(rice, { servingId: 'gone', servings: 3, amountUnit: 'serving' })).toEqual({
      choice: { kind: 'serving', servingId: 'cup' },
      amount: 1,
    });
  });
});

describe('defaultAmount', () => {
  it('starts at one serving, or one default serving’s worth of grams', () => {
    expect(defaultAmount(rice, { kind: 'serving', servingId: 'oz' })).toBe(1);
    expect(defaultAmount(rice, { kind: 'metric', unit: 'g' })).toBe(158);
    expect(defaultAmount(mystery, { kind: 'metric', unit: 'g' })).toBe(100);
  });
});

describe('portionNutrition', () => {
  it('scales one serving’s nutrition by the serving count', () => {
    const hundredGrams = rice.servings[1];
    expect(portionNutrition(hundredGrams, 1.5)).toEqual({ calories: 195, protein: 4.1, carbs: 42.3, fat: 0.5 });
  });
});

describe('describePortion', () => {
  it('shows grams for gram entries and counts for servings', () => {
    expect(describePortion(rice.servings[1], 1.5, 'g')).toBe('150 g');
    expect(describePortion(rice.servings[0], 1, 'serving')).toBe('1 cup');
    expect(describePortion(rice.servings[0], 1.5, 'serving')).toBe('1.5 × 1 cup');
    expect(describePortion(soda.servings[0], 0.5, 'ml')).toBe('177.5 ml');
  });

  it('falls back to a serving count when the metric size is unknown', () => {
    expect(describePortion(mystery.servings[0], 2, 'g')).toBe('2 × 1 bowl');
  });
});
