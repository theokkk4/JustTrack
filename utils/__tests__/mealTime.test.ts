import { defaultMealType } from '../mealTime';

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
