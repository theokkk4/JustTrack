import { toDateKey } from '../date';
import { defaultMealType, eatenAtFor } from '../mealTime';

const at = (hours: number, minutes = 0) => new Date(2026, 8, 23, hours, minutes);

describe('defaultMealType', () => {
  it('follows the time of day', () => {
    expect(defaultMealType(at(7))).toBe('breakfast');
    expect(defaultMealType(at(10, 29))).toBe('breakfast');
    expect(defaultMealType(at(10, 30))).toBe('lunch');
    expect(defaultMealType(at(15))).toBe('snacks');
    expect(defaultMealType(at(18, 45))).toBe('dinner');
    expect(defaultMealType(at(23))).toBe('snacks');
    expect(defaultMealType(at(2))).toBe('snacks');
  });
});

describe('eatenAtFor', () => {
  it('uses the current time when logging to today', () => {
    const now = at(13, 7);
    expect(eatenAtFor('2026-09-23', 'dinner', now)).toBe(now);
  });

  it('uses a representative meal time on another day, keeping the entry on that day', () => {
    const result = eatenAtFor('2026-09-20', 'dinner', at(9));
    expect(toDateKey(result)).toBe('2026-09-20');
    expect([result.getHours(), result.getMinutes()]).toEqual([18, 30]);
  });
});
