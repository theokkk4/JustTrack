import { balanceScore, MIN_CALORIES_FOR_SCORE } from '../balance';

describe('balanceScore', () => {
  it('needs enough food logged to say anything', () => {
    expect(balanceScore({ calories: MIN_CALORIES_FOR_SCORE - 1, protein: 20, carbs: 30, fat: 10 })).toBeNull();
  });

  it('scores a split inside every range at 100', () => {
    // 20% protein, 55% carbs, 25% fat
    expect(balanceScore({ calories: 2000, protein: 100, carbs: 275, fat: 56 })).toEqual({ score: 100, note: null });
  });

  it('calls out the macro furthest outside its range', () => {
    // Almost no carbs: carbs 0%, protein ~45%, fat ~55%
    const result = balanceScore({ calories: 1000, protein: 112, carbs: 0, fat: 61 });
    expect(result?.score).toBeLessThan(50);
    expect(result?.note).toBe('Carbs is on the low side today.');
  });
});
