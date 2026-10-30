import type { LogEntry } from '@/types';
import { caloriesByDay, entriesOnDay, loggedOn } from '../day';

function entry(id: string, loggedAt: string, calories = 100): LogEntry {
  return {
    id,
    loggedAt,
    mealType: 'lunch',
    source: 'usda',
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
    protein: 5,
    carbs: 10,
    fat: 2,
  };
}

const day = new Date(2026, 9, 30, 15, 0); // a local-time afternoon
const at = (hours: number, minutes = 0) => new Date(2026, 9, 30, hours, minutes).toISOString();

describe('one day of the log', () => {
  it('matches entries by local calendar day', () => {
    expect(loggedOn(entry('a', at(0)), day)).toBe(true);
    expect(loggedOn(entry('a', at(23, 59)), day)).toBe(true);
    expect(loggedOn(entry('a', new Date(2026, 9, 31, 0, 0).toISOString()), day)).toBe(false);
    expect(loggedOn({ loggedAt: 'yesterday' }, day)).toBe(false);
  });

  it('lists a day oldest first', () => {
    const entries = [entry('dinner', at(19)), entry('breakfast', at(8)), entry('other day', new Date(2026, 9, 29, 8).toISOString())];
    expect(entriesOnDay(entries, day).map((item) => item.id)).toEqual(['breakfast', 'dinner']);
  });

  it('sums calories per day', () => {
    const entries = [entry('a', at(8), 300), entry('b', at(12), 500), entry('c', new Date(2026, 9, 29, 8).toISOString(), 200)];
    expect(caloriesByDay(entries, [new Date(2026, 9, 29), day, new Date(2026, 9, 31)])).toEqual([200, 800, 0]);
  });
});
