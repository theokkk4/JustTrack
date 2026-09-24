import {
  ageFromBirthYear,
  calculateBMR,
  calculateCalorieTarget,
  calculateMacroTargets,
  calculateNutritionTargets,
  calculateTDEE,
  MIN_CALORIE_TARGET,
} from '../calorieTarget';

const man = { sex: 'male' as const, ageYears: 20, heightCm: 178, weightKg: 75 };
const woman = { sex: 'female' as const, ageYears: 19, heightCm: 165, weightKg: 60 };

describe('calculateBMR (Mifflin–St Jeor)', () => {
  it('matches the published equation for men', () => {
    expect(calculateBMR(man)).toBeCloseTo(10 * 75 + 6.25 * 178 - 5 * 20 + 5, 5);
  });

  it('matches the published equation for women', () => {
    expect(calculateBMR(woman)).toBeCloseTo(10 * 60 + 6.25 * 165 - 5 * 19 - 161, 5);
  });

  it('uses the midpoint constant when sex is unspecified', () => {
    const unspecified = calculateBMR({ ...man, sex: 'unspecified' });
    const male = calculateBMR(man);
    const female = calculateBMR({ ...man, sex: 'female' });
    expect(unspecified).toBeCloseTo((male + female) / 2, 5);
  });
});

describe('calculateTDEE', () => {
  it('scales BMR by the activity multiplier', () => {
    expect(calculateTDEE(man, 'moderate')).toBeCloseTo(calculateBMR(man) * 1.55, 5);
    expect(calculateTDEE(man, 'sedentary')).toBeLessThan(calculateTDEE(man, 'very_active'));
  });
});

describe('calculateCalorieTarget', () => {
  it('maintains at TDEE, rounded to the nearest 10', () => {
    expect(calculateCalorieTarget(man, 'moderate', 'maintain')).toBe(2740);
  });

  it('subtracts 500 to lose and adds 300 to gain', () => {
    const maintain = calculateCalorieTarget(woman, 'light', 'maintain');
    expect(calculateCalorieTarget(woman, 'light', 'lose')).toBe(maintain - 500);
    expect(calculateCalorieTarget(woman, 'light', 'gain')).toBe(maintain + 300);
  });

  it(`never recommends less than ${MIN_CALORIE_TARGET} kcal`, () => {
    const small = { sex: 'female' as const, ageYears: 30, heightCm: 150, weightKg: 45 };
    expect(calculateCalorieTarget(small, 'sedentary', 'lose')).toBe(MIN_CALORIE_TARGET);
  });
});

describe('calculateMacroTargets', () => {
  it('sets protein from bodyweight and fat at 30% of calories', () => {
    expect(calculateMacroTargets(2740, 75, 'maintain')).toEqual({ protein: 105, fat: 91, carbs: 375 });
  });

  it('uses 1.6 g/kg protein when losing or gaining', () => {
    expect(calculateMacroTargets(2000, 70, 'lose').protein).toBe(112);
    expect(calculateMacroTargets(3000, 70, 'gain').protein).toBe(112);
  });

  it('caps protein at 35% of calories for very heavy users', () => {
    const { protein } = calculateMacroTargets(1500, 200, 'lose');
    expect(protein * 4).toBeLessThanOrEqual(1500 * 0.35 + 2);
  });

  it('keeps macro calories within rounding of the calorie target', () => {
    for (const calories of [1200, 1800, 2500, 3400]) {
      const { protein, carbs, fat } = calculateMacroTargets(calories, 80, 'gain');
      expect(Math.abs(protein * 4 + carbs * 4 + fat * 9 - calories)).toBeLessThanOrEqual(10);
    }
  });
});

describe('calculateNutritionTargets', () => {
  it('combines the calorie target and macros', () => {
    expect(calculateNutritionTargets(woman, 'light', 'lose')).toEqual({ calories: 1390, protein: 96, fat: 46, carbs: 148 });
  });
});

describe('ageFromBirthYear', () => {
  it('computes age in years from a birth year', () => {
    expect(ageFromBirthYear(2005, new Date(2026, 8, 24))).toBe(21);
  });
});
