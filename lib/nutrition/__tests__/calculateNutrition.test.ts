import {
  calculateNutrition,
  calculateNutritionForServings,
  calculateProgress,
  calculateRemaining,
  estimateCaloriesFromMacros,
  sumNutrition,
} from '../calculateNutrition';

describe('calculateNutrition', () => {
  it('scales a per-100g basis up to a larger portion', () => {
    const chickenPer100g = { calories: 165, protein: 31, carbs: 0, fat: 3.6, referenceGrams: 100 };
    expect(calculateNutrition(chickenPer100g, 150)).toEqual({
      calories: 247.5,
      protein: 46.5,
      carbs: 0,
      fat: 5.4,
    });
  });

  it('scales down for a smaller portion than the reference', () => {
    const rice = { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, referenceGrams: 100 };
    expect(calculateNutrition(rice, 50)).toEqual({ calories: 65, protein: 1.4, carbs: 14, fat: 0.2 });
  });

  it('returns all zeros for 0 grams', () => {
    const basis = { calories: 200, protein: 10, carbs: 20, fat: 5, referenceGrams: 100 };
    expect(calculateNutrition(basis, 0)).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it('throws for a non-positive reference weight', () => {
    expect(() => calculateNutrition({ calories: 1, protein: 1, carbs: 1, fat: 1, referenceGrams: 0 }, 10)).toThrow();
  });

  it('throws for negative target grams', () => {
    const basis = { calories: 100, protein: 1, carbs: 1, fat: 1, referenceGrams: 100 };
    expect(() => calculateNutrition(basis, -5)).toThrow();
  });
});

describe('calculateNutritionForServings', () => {
  it('multiplies per-serving nutrition by the serving count', () => {
    const perServing = { calories: 190, protein: 3, carbs: 25, fat: 9 };
    expect(calculateNutritionForServings(perServing, 2)).toEqual({ calories: 380, protein: 6, carbs: 50, fat: 18 });
  });

  it('supports fractional servings', () => {
    const perServing = { calories: 200, protein: 4, carbs: 30, fat: 8 };
    expect(calculateNutritionForServings(perServing, 0.5)).toEqual({ calories: 100, protein: 2, carbs: 15, fat: 4 });
  });
});

describe('sumNutrition', () => {
  it('sums multiple meal items into daily/meal totals', () => {
    const items = [
      { calories: 248, protein: 46, carbs: 0, fat: 5 },
      { calories: 260, protein: 5, carbs: 57, fat: 0.5 },
      { calories: 35, protein: 2, carbs: 7, fat: 0.3 },
    ];
    expect(sumNutrition(items)).toEqual({ calories: 543, protein: 53, carbs: 64, fat: 5.8 });
  });

  it('returns zeros for an empty list', () => {
    expect(sumNutrition([])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe('calculateRemaining', () => {
  it('returns a positive remaining when under goal', () => {
    expect(calculateRemaining(2400, 1842)).toBe(558);
  });

  it('returns a negative remaining when over goal', () => {
    expect(calculateRemaining(2000, 2200)).toBe(-200);
  });
});

describe('calculateProgress', () => {
  it('computes a fraction between 0 and 1', () => {
    expect(calculateProgress(90, 180)).toBe(0.5);
  });

  it('clamps progress at 1 when over goal', () => {
    expect(calculateProgress(250, 180)).toBe(1);
  });

  it('returns 0 for a zero or negative goal instead of dividing by zero', () => {
    expect(calculateProgress(50, 0)).toBe(0);
  });
});

describe('estimateCaloriesFromMacros', () => {
  it('applies Atwater factors (4/4/9)', () => {
    expect(estimateCaloriesFromMacros({ protein: 46, carbs: 64, fat: 5.8 })).toBe(
      Math.round(46 * 4 + 64 * 4 + 5.8 * 9)
    );
  });
});
